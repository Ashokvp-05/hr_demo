# 🌐 Rudratic HR: Frontend Interface (Next.js 16)

The **Frontend Interface** is the interactive, high-performance web layer of the Rudratic HRMS. Built with the latest Next.js 16 (App Router) and Tailwind CSS 4, it provides a premium, low-latency experience for Employees, Managers, and Admins.

[![Next.js](https://img.shields.io/badge/Runtime-Next.js%2016-black?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind](https://img.shields.io/badge/Styling-Tailwind--4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Animations-Framer--Motion-ff0055?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🚀 Key Interface Features
*   **📊 Strategic Dashboards**: Real-time analytics and attendance tracking with high-fidelity Recharts visualizations.
*   **🕒 Smart Attendance**: GPS-tagged clock-in/out system with instant shift synchronization.
*   **📅 Leave Management**: Comprehensive leave requests with live balance counters and status history.Admin@123	
*   **🤖 Nexus AI Assistant**: Integrated natural language chat interface for HR policies and data queries.
*   **📱 Fully Responsive**: Optimized layouts for Desktop, Tablet, and Mobile using modern Grid and Flexbox patterns.
*   **🌓 Adaptive Theme**: Sleek Dark and Light mode support with automatic OS detection.

---

## 🛠️ Tech Stack & Architecture
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 (with CSS variables engine)
- **Animations**: Framer Motion & Lucide React Icons
- **State Management**: React Server Components + Client-side Hooks
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner (Toast system) for real-time feedback

### 📂 Folder Structure
```bash
/src
  /app          # App Router (Pages & Layouts)
  /components   # Shared UI components (Radix UI)
  /hooks        # Custom React hooks
  /lib          # Utilities, API client (Axios/Fetch)
  /types        # Global TypeScript definitions
  /services     # API abstraction layer
```

---

## ⚙️ Setup & Configuration

### **1. Environment Configuration**
Create a `.env.local` file in this directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
AUTH_SECRET="your-generated-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### **2. Development Commands**
```bash
# Install dependencies
npm install

# Start Local Dev Server
npm run dev

# Build for Production
npm run build
```
*Frontend will be running at [http://localhost:3000](http://localhost:3000)*

---

## 🛡️ Performance & Security
- **Zod Validation**: Comprehensive client-side schema validation for all forms.
- **Optimized Assets**: Next.js image optimization and font subsetting for <1s load times.
- **RBAC Guards**: Middleware-level route protection based on User Roles (ADMIN, MANAGER, EMPLOYEE).

---
*© 2026 Rudratic Technologies. All rights reserved.*
