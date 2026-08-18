import type { TourStep } from "@/components/tour/TourContext"

export const EMP_TOUR_LS_KEY = "hr_emp_tour_seen"

export const employeeTourSteps: TourStep[] = [
    {
        target: "emp-header",
        title: "Welcome to your Employee Portal",
        description: "This is your personal HR workspace. You can view your attendance, apply for leaves, download payslips, and stay up to date with company announcements.",
        position: "bottom",
    },
    {
        target: "emp-sidebar-profile",
        title: "My Profile",
        description: "View and update your personal details — name, contact information, department, and role. Keep your profile accurate so HR has the right information.",
        position: "right",
    },
    {
        target: "emp-sidebar-attendance",
        title: "My Attendance",
        description: "See your complete check-in and check-out history. Your attendance record is updated in real-time each working day.",
        position: "right",
    },
    {
        target: "emp-sidebar-leaves",
        title: "Leave Requests",
        description: "Apply for annual leave, sick leave, or other time off from here. Track the status of your applications — Pending, Approved, or Rejected.",
        position: "right",
    },
    {
        target: "emp-sidebar-payroll",
        title: "My Payslips",
        description: "Download your monthly payslips as PDF. View your salary breakdown, allowances, and deductions for any month.",
        position: "right",
    },
    {
        target: "emp-sidebar-announcements",
        title: "Announcements",
        description: "Stay informed with company-wide announcements from HR and management. Important notices will always appear here first.",
        position: "right",
    },
]
