import { PrismaClient } from '@prisma/client';

// ── Prisma Singleton with Connection Pool ─────────────────────────────────────
// Prevents multiple PrismaClient instances during hot-reload in dev.
// Connection pool tuned for production: max 10 connections, 20s timeout.
// ─────────────────────────────────────────────────────────────────────────────
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL + (
                process.env.DATABASE_URL?.includes('?') ? '&' : '?'
            ) + 'connection_limit=10&pool_timeout=20&statement_cache_size=100',
        },
    },
    log: process.env.NODE_ENV === 'production'
        ? ['error', 'warn']          // Minimal logging in prod
        : process.env.NODE_ENV === 'test'
            ? ['error']              // Quiet during tests
            : ['query', 'error', 'warn'] // Verbose in dev
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown — release all DB connections cleanly
process.on('beforeExit', async () => { await prisma.$disconnect(); });
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });

export default prisma;
