import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';

dotenv.config();

// Ensure NODE_ENV is set for production optimizations
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

const app = express();
app.set('etag', false); // Disable etag for simpler debugging

// Behind Cloudflare Tunnel / reverse proxy: trust the first proxy hop so
// req.ip reflects the real client (correct rate-limit keying) not the proxy.
app.set('trust proxy', 1);

// ─── Multi-Origin CORS ────────────────────────────────────────────────────────
// Reads CORS_ORIGINS from env as a comma-separated list of allowed frontend URLs.
// Add any new URL (Cloudflare tunnel, custom domain, localhost port) to the
// CORS_ORIGINS variable in your root .env — no code change required.
//
// Always-allowed patterns (wildcard):
//   • Any localhost / 127.x / 192.168.x / LAN IP
//   • *.swotpam.com
//   • *.trycloudflare.com   ← Cloudflare quick-tunnel URLs
//   • *.cfargotunnel.com    ← Cloudflare named-tunnel URLs
//   • *.vercel.app
//   • *.onrender.com
// ─────────────────────────────────────────────────────────────────────────────
const envOrigins: string[] = [
    // Parse CORS_ORIGINS comma-separated list (primary source)
    ...(process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    // Legacy single-origin fallbacks
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_FRONTEND_URL,
    // Always include localhost defaults
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:3000',
    'http://[::1]:3000',
].filter((v): v is string => Boolean(v));

// Deduplicate
const allowedOrigins = [...new Set(envOrigins)];

console.log(`[CORS] Allowed origins (${allowedOrigins.length}):`, allowedOrigins);

// Shared public-PaaS suffixes (*.vercel.app, *.onrender.com) let ANY tenant on
// those platforms make credentialed requests, so they are OFF by default and
// only enabled via CORS_ALLOW_PAAS=true for teams that deliberately need them.
const allowPaas = process.env.CORS_ALLOW_PAAS === 'true';
const isProdEnv = process.env.NODE_ENV === 'production';

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);

        // Exact match from env list (the primary, recommended mechanism)
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // localhost / LAN only outside production
        const isLocalIP = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|\[::1\])(:\d+)?$/.test(origin);
        if (isLocalIP && !isProdEnv) return callback(null, true);

        // First-party infrastructure — always trusted
        const isSwotpam       = origin.endsWith('.swotpam.com');
        const isCFQuickTunnel = origin.endsWith('.trycloudflare.com');
        const isCFNamedTunnel = origin.endsWith('.cfargotunnel.com');
        if (isSwotpam || isCFQuickTunnel || isCFNamedTunnel) return callback(null, true);

        // Shared public PaaS — opt-in only
        if (allowPaas && (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com'))) {
            return callback(null, true);
        }

        console.warn('[CORS] Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(compression({
    level: 6,       // Best CPU-to-ratio balance
    threshold: 1024 // Only compress responses > 1KB
}));

// Production: 'combined' log format (Apache-style, good for log parsers)
// Development: 'dev' (colorized, concise)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Response-Time Header ──────────────────────────────────────────────────────
// Adds X-Response-Time header so Cloudflare dashboard shows backend latency
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        if (!res.headersSent) {
            res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
        }
    });
    next();
});

// ── HTTP Cache-Control for Read-Heavy Routes ──────────────────────────────────
// Browsers & Cloudflare cache these routes — reduces repeated DB hits significantly
app.use((req, res, next) => {
    if (req.method !== 'GET') return next(); // Only cache GET

    // These routes carry per-tenant data, so they must use `private` caching —
    // never `public`, which would let shared caches / CDNs serve one tenant's
    // data to another. `private` keeps it in the user's own browser only.
    const PRIVATE_5MIN = 'private, max-age=300, stale-while-revalidate=60';
    const PRIVATE_1HR  = 'private, max-age=3600, stale-while-revalidate=300';
    const NO_STORE     = 'no-store, no-cache';

    if (
        req.path.startsWith('/api/holidays') ||
        req.path.startsWith('/api/announcements') ||
        req.path.startsWith('/api/organization') ||
        req.path.startsWith('/api/companies')
    ) {
        res.set('Cache-Control', PRIVATE_5MIN);
    } else if (req.path.startsWith('/api/leave-v2/types')) {
        res.set('Cache-Control', PRIVATE_1HR);
    } else if (
        req.path.startsWith('/api/auth') ||
        req.path.startsWith('/api/payroll') ||
        req.path.startsWith('/api/payslips')
    ) {
        res.set('Cache-Control', NO_STORE); // Never cache sensitive routes
    }
    next();
});

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.get('/', (req, res) => {
    res.json({ message: 'Rudratic HR System API is running', timestamp: new Date() });
});

app.get('/api', (req, res) => {
    res.json({
        status: 'Operational',
        version: '1.0.0-GA',
        latency: 'minimal',
        compression: 'enabled'
    });
});

// Routes
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import userRoutes from './routes/user.routes';
import timeEntryRoutes from './routes/timeEntry.routes';
import notificationRoutes from './routes/notification.routes';
import holidayRoutes from './routes/holiday.routes';
import leaveRoutes from './routes/leave.routes';
import profileRoutes from './routes/profile.routes';
import reportRoutes from './routes/report.routes';
import announcementRoutes from './routes/announcement.routes';
import ticketRoutes from './routes/ticket.routes';
import kudosRoutes from './routes/kudos.routes';
import performanceRoutes from './routes/performance.routes';
import aiRoutes from './routes/ai.routes';
import payslipRoutes from './routes/payslip.routes';
import payrollRoutes from './routes/payroll.routes';
import companyRoutes from './routes/company.routes';
import organizationRoutes from './routes/organization.routes';
import attendanceV2Routes from './routes/attendance-v2.routes';
import leaveV2Routes from './routes/leave-v2.routes';
import documentRoutes from './routes/document.routes';
import leaveEmailActionRoutes from './routes/leave-email-action.routes';
import settingsRoutes from './routes/settings.routes';
import skillsRoutes from './routes/skills.routes';
import dashboardRoutes from './routes/dashboard.routes';
import demoRoutes from './routes/demo.routes';
import { initCronJobs } from './services/cron.service';
import { setupSwagger } from './config/swagger';
import companyDocumentRoutes from './routes/company-document.routes';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware';

// Initialize Scheduled Tasks (skipped under test to avoid open handles / DB noise)
if (process.env.NODE_ENV !== 'test') {
    initCronJobs();
}

// Setup Swagger UI
setupSwagger(app);

// Global API rate limit (abuse ceiling), then a strict limiter on auth.
app.use('/api', apiLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/time', timeEntryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/kudos', kudosRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/attendance-v2', attendanceV2Routes);
app.use('/api/leave-v2', leaveV2Routes);
app.use('/api/performance', performanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/company-documents', companyDocumentRoutes);
app.use('/api/leave-email-action', leaveEmailActionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/skills', skillsRoutes);

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler - must be after all routes
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Global error handler - must be last
import { errorHandler } from './middleware/error.middleware';
app.use(errorHandler);

export default app;
