# 🚀 Deployment Infrastructure Requirements (Backend)
## Rudratic Personnel Core — Production Manifest

This document specifies the exact environment and dependency matrix required for the production deployment of the **Rudratic HR Backend API**.

---

## 🏗️ 1. Runtime Environment
| Component | Requirement | Specification |
| :--- | :--- | :--- |
| **Operating System** | Linux (Recommended) or Windows Server | Ubuntu 22.04 LTS / Windows Server 2022 |
| **Node.js Engine** | v18.17.0+ (LTS) | `node -v` |
| **Package Manager** | npm v9.0.0+ | `npm -v` |
| **Process Manager** | PM2 (Global) | For cluster mode & auto-recovery |

---

## 💾 2. Infrastructure Requirements
- **PostgreSQL Database**:
  - Version: 14.x or 18.x
  - Connectivity: Accessible from the application server on port `5432`.
  - Roles: A dedicated user with `CREATEDB` and `LOGIN` permissions.
- **Reverse Proxy**:
  - **Nginx** (Linux) or **IIS** (Windows).
  - SSL/TLS: Required (Port 443) via Let's Encrypt or Domain Certificate.
- **Port Allocation**:
  - API Listener: `4000` (Internal).
  - Proxy Target: Mapping `https://api.yourdomain.com` ➔ `http://localhost:4000`.

---

## 🔐 3. Environment Secrets Matrix
The following variables **MUST** be defined in the production process (e.g., via `PM2 ecosystem.config` or Docker Secrets):

| Variable | Security Level | Purpose |
| :--- | :---: | :--- |
| `DATABASE_URL` | 🔴 CRITICAL | Connection string for PostgreSQL. |
| `JWT_SECRET` | 🔴 CRITICAL | Minimum 64-character entropy for signing tokens. |
| `PORT` | 🟢 LOW | Port for the Express server (Default: 4000). |
| `FRONTEND_URL` | 🟡 MEDIUM | Allowed origin for CORS headers. |
| `NODE_ENV` | 🟡 MEDIUM | Must be set to `production`. |

---

## 📦 4. Deployment Build Manifest
Run these commands in order during the CI/CD pipeline:

1. **Install Dependencies** (Clean Slate):
   ```bash
   npm ci --omit=dev
   ```

2. **Database Client Generation**:
   ```bash
   npx prisma generate
   ```

3. **Production Compilation**:
   ```bash
   npm run build
   ```

4. **Service Launch**:
   ```bash
   pm2 start dist/server.js --name "hr-backend-api"
   ```

---
*Generated: March 2026 for Rudratic Personnel Core*
