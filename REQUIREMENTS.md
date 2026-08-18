# SWOT HR - System Requirements & Dependencies

To securely and effectively run the Swot HR Unified Platform, the hosting and operational environments must meet the following structural guidelines and dependencies.

## 1. Primary Operating Environment
The software maintains OS-agnostic capacities natively through Node JS implementations, but is structured locally on Windows and optimally deployed on Linux-based production servers.

- **OS Target**: Windows 10/11 (Local Dev), Ubuntu/Debian Linux 20.04+ (Production via Docker or Nginx Proxy)
- **Node Environment**: `Node.js >= 18.17.x LTS`
- **Package Management**: `npm >= 9.0.x` or `yarn >= 1.22.x`

## 2. Infrastructure & Compute 
For stable execution of both React UI SSR (Server Side Rendering) and the Express/Prisma Database Connections:

### Minimal Local Setup
- **Processor**: Intel i5/AMD Ryzen 5 (multi-core strictly advised)
- **RAM Memory**: Minimal 4 GB (8 GB Recommended for seamless full-stack dev)
- **Disk Storage**: 500 MB for static build / modules + ample size for DB allocation.

## 3. Core Software Dependencies 

### Backend (Node / Express) Core Dependencies
- `@prisma/client`: Database Object-Relational Mapping (v5.22+)
- `@supabase/supabase-js`: Object Storage handling 
- `express`: REST API Infrastructure
- `jsonwebtoken` / `bcryptjs`: Security & Authorization Protocol Layer
- `node-cron`: Time-based systemic scheduler 
- `zod`: Request Schema Validation
- `multer` / `exceljs` / `jspdf`: File processing protocols

### Frontend (Next.js) Core Dependencies
- `next`: React Framework Protocol (v14.1+)
- `framer-motion`: High-fidelity micro-animation driver
- `lucide-react`: SVG Iconography engine
- `tailwindcss`: Utility CSS Matrix 
- `sonner`: High-fidelity interactive toast alerts

## 4. Database Protocols
- **Engine Protocol**: `PostgreSQL 14.x or higher`
- **Driver Integration**: Automated schema resolution via Prisma Client.
- *Notes: Prisma automatically manages schema generation (`prisma db push`), but manual PostgreSQL initiation is required prior to startup.*

## 5. Required Environment Variables

When initiating the workspace, the following mapping keys MUST be verified:

**Global Backend Context (`/backend/.env`)**
```properties
DATABASE_URL="postgres://<user>:<password>@<host>:<port>/<dbname>"
PORT="4000"
JWT_SECRET="strong_cryptographic_string"
```

**Global Frontend Context (`/frontend/.env.local`)**
```properties
NEXT_PUBLIC_API_URL="http://localhost:4000/api"  # Target to backend router
```

## 6. Access / Peripheral Dependencies
- Access to global network proxy rules allowing traffic over `TCP Port 3000` (Next.js) and `TCP Port 4000` (Express/Node).
- A modern capable web browser (Chrome v95+, Firefox v90+, Edge) for complete rendering of CSS Glassmorphism logic and Flexbox constraints.
