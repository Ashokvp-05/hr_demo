import type { TourStep } from "@/components/tour/TourContext"

export const ADMIN_TOUR_LS_KEY = "hr_admin_tour_seen"

export const adminTourSteps: TourStep[] = [
    {
        target: "admin-header",
        title: "Welcome to your Admin Dashboard",
        description: "This is your command centre. From here you can manage employees, track attendance, handle payroll, approve access requests, and much more.",
        position: "bottom",
    },
    {
        target: "admin-stats",
        title: "Executive Stats Cards",
        description: "These live cards show real-time totals — Total Employees, Active Today, Pending Approvals, Leave Approved, and On Leave Today. They update automatically.",
        position: "bottom",
    },
    {
        target: "admin-sidebar-employees",
        title: "Manage Employees",
        description: "Click here to browse your entire workforce. You can search, filter by department, view individual profiles, and update employee details.",
        position: "right",
    },
    {
        target: "admin-sidebar-add",
        title: "Add Employee",
        description: "Onboard a new team member in seconds — fill in their name, department, role, and salary. They'll be immediately visible across all modules.",
        position: "right",
    },
    {
        target: "admin-sidebar-attendance",
        title: "Attendance Tracking",
        description: "Monitor daily check-in and check-out records for every employee. Use the calendar heatmap to spot patterns and identify attendance issues.",
        position: "right",
    },
    {
        target: "admin-sidebar-leaves",
        title: "Leave Management",
        description: "Review all leave applications from your team. Approve or reject requests with a single click. Filter by status or date range.",
        position: "right",
    },
    {
        target: "admin-sidebar-payroll",
        title: "Payroll",
        description: "Generate monthly payslips for all employees. Review salary breakdowns, deductions, and allowances — then export as PDF.",
        position: "right",
    },
    {
        target: "admin-approve-requests",
        title: "Access Requests",
        description: "When users sign up with personal email addresses (Gmail, Yahoo, etc.), their requests appear here. Approve or reject with one click to grant them portal access.",
        position: "bottom",
    },
]
