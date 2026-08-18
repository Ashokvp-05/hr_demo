# Swot HR Unified Platform

A high-fidelity, unified Human Resources Management System designed for precise personnel management, operational scaling, and lifecycle tracking. Structured with a "Clinical Neat" aesthetic ensuring that administrative interfaces remain ultra-clean, functional, and devoid of clutter.

## 🚀 Technical Stack

- **Frontend Core**: [Next.js (App Router)](https://nextjs.org/) + React 
- **Styling & UI**: Tailwind CSS, Framer Motion (for dynamic micro-animations), Lucide React (iconography), and Radix UI primitives.
- **Backend Infrastructure**: Express.js with TypeScript
- **Database ORM**: Prisma Client integrating with a SQL Database (PostgreSQL natively supported).
- **Authentication**: Custom JWT protocols managed via bcryptjs.
- **Background Tasks**: node-cron for scheduled syncing and data tasks.

## 📁 Repository Structure

```text
swot-project-main/
├── backend/                # Express & Prisma Backend Architecture
│   ├── src/                # Core controllers, services, routes
│   ├── prisma/             # Schema files & database seeding
│   └── package.json
├── frontend/               # Next.js Application Core
│   ├── src/app/            # App Router pages (admin, manager, employee)
│   ├── src/components/     # Modular UI blocks, shards, and components
│   └── package.json
└── package.json            # Root configuration for coordinated builds
```

## ⚙️ Quick Start Guide

### 1. Initial Setup
Ensure you have the minimum system requirements (see `REQUIREMENTS.md`). Clone the repository and initialize properties:

```bash
# Clone the repository
git clone https://github.com/Ashokvp-05/hr--final-fd--modification.git
cd swot-project-main

# Install dependencies (must be done in both directories)
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration
Create `.env` files in both the strictly-typed backend and frontend environments based on your local setups.

**`backend/.env` Requirements:**
```env
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/swot_hr"
JWT_SECRET="YOUR_SECURE_AUTH_KEY"
```

**`frontend/.env.local` Requirements:**
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

### 3. Database Initialization
Synchronize your local Prisma client and deploy the schema:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Concurrent Development Server
You can spawn both processing nodes instantly using `concurrently` from the project root:
```bash
npx concurrently "npm run --prefix backend dev" "npm run --prefix frontend dev"
```
* **Frontend UI**: [http://localhost:3000](http://localhost:3000)
* **API Service**: [http://localhost:4000](http://localhost:4000)

## 🏗️ Production Build and Deployment
The project incorporates a unified packaging mechanism for automated deployment preparation:
```bash
npm run pack
```
This prepares local production bundles mimicking a distributed release logic under `FINAL_RELEASE/`.

---
*Maintained under the standards of Rudraic Architecture Protocols.*
