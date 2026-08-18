# 🏢 Swot HR Unified Platform — Project Overview

> **Maintained under Rudraic Architecture Protocols**  
> An enterprise-grade Human Resources Management System (HRMS) with a "Clinical Neat" aesthetic.

---

## 🏗️ Architecture at a Glance

```mermaid
graph TD
    A[Browser / User] -->|HTTPS| B[Next.js Frontend :3000]
    B -->|REST API /api/*| C[Express Backend :4000]
    C -->|Prisma ORM| D[(PostgreSQL DB)]
    C -->|Cron Jobs| E[Scheduled Tasks]
    C -->|WebSocket| F[Real-time Updates]
    B -->|Auth| G[NextAuth v5 / JWT]
    C -->|Email| H[Resend Email Service]
```

**Production Deployment** runs via Docker Compose:
- `hr-frontend` → port `8080` (Next.js)
- `hr-backend` → port `8443` (Express)
- `hr-db` → internal only (PostgreSQL 15)
- Domain: `https://hr.swotpam.com`

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router) + React 19 |
| **Styling** | Tailwind CSS v4, Framer Motion, Radix UI |
| **Backend** | Express.js + TypeScript |
| **ORM** | Prisma v5 (PostgreSQL) |
| **Auth** | NextAuth v5 (beta) + JWT + bcryptjs |
| **Real-time** | WebSockets (`ws` library) |
| **Scheduling** | node-cron |
| **Email** | Resend API |
| **PDF/Export** | jsPDF, jspdf-autotable, html2canvas-pro |
| **Charts** | Recharts |
| **2FA** | otplib + QR Code |
| **Forms** | react-hook-form + Zod validation |
| **Data Fetching** | SWR |

---

## 📁 Project Structure

```
swot-project-main/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express app config, CORS, middleware, route registration
│   │   ├── server.ts           # HTTP server entry point
│   │   ├── controllers/        # 25 controllers (see below)
│   │   ├── routes/             # 27 route files
│   │   ├── services/           # 31 service files (business logic)
│   │   ├── middleware/         # Auth, error handling
│   │   ├── config/             # App configuration
│   │   └── scripts/            # Utility scripts
│   ├── prisma/
│   │   ├── schema.prisma       # Full DB schema (~38KB)
│   │   └── seed.ts             # Database seeding
│   └── uploads/                # File upload storage
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (auth)/         # Login page (no public registration)
│       │   ├── (dashboard)/    # Protected dashboard routes
│       │   │   ├── admin/      # Admin-specific pages (announcements, attendance, audit-logs,
│       │   │   │               #   database, employee-details, holidays, leaves, organization,
│       │   │   │               #   payroll, reports, settings, users, dashboard)
│       │   │   ├── manager/    # Manager views
│       │   │   ├── employee/   # Employee self-service
│       │   │   ├── payroll/    # Payroll management
│       │   │   ├── payslip/    # Payslip viewer
│       │   │   ├── leave/      # Leave management
│       │   │   ├── attendance/ # Attendance tracking
│       │   │   ├── performance/# Performance reviews
│       │   │   ├── reports/    # Reports module
│       │   │   ├── notifications/ # Notification center
│       │   │   ├── announcements/ # Company announcements
│       │   │   ├── kudos/      # Employee recognition
│       │   │   ├── support/    # IT support tickets
│       │   │   ├── auditor/    # Audit logs view
│       │   │   ├── settings/   # User settings
│       │   │   ├── profile/    # Employee profile
│       │   │   └── history/    # Activity history
│       │   └── api/            # Next.js API routes (proxy layer)
│       ├── components/
│       │   ├── admin/          # Admin-specific UI components
│       │   ├── dashboard/      # Dashboard widgets & charts
│       │   ├── manager/        # Manager-specific components
│       │   ├── layout/         # Sidebar, navbar, shell layout
│       │   ├── auth/           # Login/auth components
│       │   ├── ui/             # Reusable shadcn/Radix UI primitives
│       │   ├── leave/          # Leave management UI
│       │   ├── kudos/          # Kudos/recognition UI
│       │   ├── tickets/        # Support ticket UI
│       │   ├── wellness/       # Wellness features
│       │   ├── ai/             # AI assistant UI
│       │   ├── landing/        # Landing/marketing components
│       │   └── FloatingTicketButton.tsx
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # Utilities, API client
│       ├── types/              # TypeScript type definitions
│       ├── auth.ts             # NextAuth configuration
│       └── proxy.ts            # API proxy helper
│
└── docker-compose.yml          # Production orchestration
```

---

## 🔌 Backend API Modules (25 Controllers / 27 Route Files)

| Module | Route Prefix | Description |
|---|---|---|
| Auth | `/api/auth` | Login, logout, JWT, 2FA |
| Admin | `/api/admin` | Super-admin operations |
| Users | `/api/users` | User CRUD & management |
| Profile | `/api/profile` | Employee profile management |
| Dashboard | `/api/dashboard` | Dashboard stats & metrics |
| Attendance v2 | `/api/attendance-v2` | Modern attendance tracking |
| Leave | `/api/leaves` | Leave requests & approvals |
| Leave v2 | `/api/leave-v2` | Enhanced leave management |
| Time Entry | `/api/time` | Time logging |
| Payroll | `/api/payroll` | Payroll computation |
| Payslip | `/api/payslips` | Payslip generation & PDF |
| Holidays | `/api/holidays` | Company holiday calendar |
| Announcements | `/api/announcements` | Company announcements |
| Notifications | `/api/notifications` | In-app notifications |
| Tickets | `/api/tickets` | IT/HR support tickets |
| Calendar | `/api/calendar` | Calendar events |
| Kudos | `/api/kudos` | Employee recognition |
| Performance | `/api/performance` | Performance reviews |
| Reports | `/api/reports` | Analytics & reporting |
| Organization | `/api/organization` | Org chart management |
| Company | `/api/companies` | Company settings |
| Lifecycle | `/api/lifecycle` | Employee lifecycle events |
| Workflow | `/api/workflows` | HR workflow automation |
| AI | `/api/ai` | AI assistant features |
| BI | `/api/bi` | Business intelligence |
| Enterprise | `/api/enterprise` | Enterprise-tier features |
| Documents | `/api/documents` | Document management |

---

## 👥 Role-Based Access Control (RBAC)

| Role | Access Level |
|---|---|
| **Super Admin** | Full system access, user provisioning |
| **Admin** | HR operations, payroll, reports, org management |
| **Manager** | Team attendance, leave approvals, performance |
| **Employee** | Self-service (profile, leave, payslip, kudos) |
| **Auditor** | Read-only audit logs & reports |

> No public registration — all user onboarding is handled exclusively by admins.

---

## 🔧 Key Services (Backend)

| Service | Responsibility |
|---|---|
| `auth.service.ts` | JWT issuance, bcrypt hashing, 2FA |
| `cron.service.ts` | Scheduled jobs (attendance sync, payroll) |
| `payslip.service.ts` | Payslip generation & PDF export |
| `payroll.service.ts` | Salary calculation & processing |
| `email.service.ts` | Transactional emails via Resend |
| `websocket.service.ts` | Real-time push to connected clients |
| `admin.service.ts` | Admin CRUD & bulk operations |
| `dashboard.service.ts` | Aggregated KPIs & metrics |
| `leave.service.ts` | Leave balance & approval workflow |
| `attendance-v2.service.ts` | Check-in/check-out tracking |

---

## 🌐 Environment Variables

**Backend (`backend/.env`)**
```env
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/swot_hr
JWT_SECRET=YOUR_SECURE_AUTH_KEY
FRONTEND_URL=https://hr.swotpam.com
```

**Frontend (`frontend/.env.local`)**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## 🚀 Development Servers

Both servers currently running:
- **Frontend**: `npm run dev` on `http://localhost:8080`
- **Backend**: `npm run dev` on `http://localhost:4000`

---

## 📌 Key Design Decisions

1. **No public registration** — admin-only user provisioning
2. **JWT + NextAuth v5** — hybrid auth with server-side session management
3. **Prisma ORM** — type-safe database access with schema migrations
4. **WebSocket** — real-time telemetry for live dashboard metrics
5. **CORS** — allows local IPs + `*.swotpam.com`, `*.vercel.app`, `*.onrender.com`
6. **Docker** — fully containerized with health checks on all services
7. **Cloudflare Tunnel** — production access via `hr.swotpam.com`
