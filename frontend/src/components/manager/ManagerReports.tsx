"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users, Clock, Calendar, CheckCircle2,
    TrendingUp, TrendingDown, AlertCircle,
    Building2, BarChart3, Download, RefreshCcw,
    UserCheck, UserX, ArrowUpRight, Minus,
    Search, ChevronDown, ChevronUp, X,
    CalendarDays, CalendarRange
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useWebSocket } from "@/hooks/useWebSocket"
import { jsPDF } from "jspdf"
import { Badge } from "@/components/ui/badge"
import { format, startOfMonth, endOfMonth } from "date-fns"
import {
    Dialog, DialogContent, DialogTitle, DialogDescription
} from "@/components/ui/dialog"

const GlobalStyles = () => (
    <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        .font-brand { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    `}</style>
)

interface Employee {
    id: string; name: string; email: string; status: string
    department?: { name: string }; role?: { name: string }
}

interface AttendanceRecord {
    id: string; clockIn: string; clockOut?: string
    hoursWorked?: number; clockType: string
    user: { name: string; email: string }
}

interface EmpMonthlyStats {
    totalDays: number; presentDays: number; lateDays: number
    leaveDays: number; totalHours: number; avgHours: number
    records: AttendanceRecord[]
}

interface ReportData {
    totalEmployees: number
    presentToday: number
    onLeave: number
    pendingLeaves: number
    departments: { name: string; staff: number; attendance: number; leavedays: number }[]
}

export default function ManagerReports({ token }: { token: string }) {
    const [data, setData] = useState<ReportData>({
        totalEmployees: 0,
        presentToday: 0,
        onLeave: 0,
        pendingLeaves: 0,
        departments: []
    })
    const [loading, setLoading] = useState(true)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [empSearch, setEmpSearch] = useState("")
    const [expandedEmp, setExpandedEmp] = useState<string | null>(null)
    const [empAttendance, setEmpAttendance] = useState<Record<string, AttendanceRecord[]>>({})
    const [empLeaves, setEmpLeaves] = useState<Record<string, number>>({})
    const [loadingEmpData, setLoadingEmpData] = useState(false)

    // Dialog and filtering state
    const [isDailyModalOpen, setIsDailyModalOpen] = useState(false)
    const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState("2026-05")
    const [monthlyFilterLoading, setMonthlyFilterLoading] = useState(false)
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
    const [monthlyAttendance, setMonthlyAttendance] = useState<any[]>([])
    const [leaves, setLeaves] = useState<any[]>([])

    const fetchMonthlyAttendanceData = useCallback(async (monthStr: string) => {
        if (!token) return
        setMonthlyFilterLoading(true)
        try {
            const [year, month] = monthStr.split("-").map(Number)
            const startDate = `${monthStr}-01`
            const lastDay = new Date(year, month, 0).getDate()
            const endDate = `${monthStr}-${String(lastDay).padStart(2, '0')}`

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/attendance?start=${startDate}&end=${endDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setMonthlyAttendance(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error("Failed to fetch monthly attendance records:", error)
        } finally {
            setMonthlyFilterLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (isMonthlyModalOpen) {
            fetchMonthlyAttendanceData(selectedMonth)
        }
    }, [selectedMonth, isMonthlyModalOpen, fetchMonthlyAttendanceData])

    const monthsList = [
        { label: "January 2026", value: "2026-01" },
        { label: "February 2026", value: "2026-02" },
        { label: "March 2026", value: "2026-03" },
        { label: "April 2026", value: "2026-04" },
        { label: "May 2026", value: "2026-05" },
        { label: "June 2026", value: "2026-06" },
        { label: "July 2026", value: "2026-07" },
        { label: "August 2026", value: "2026-08" },
        { label: "September 2026", value: "2026-09" },
        { label: "October 2026", value: "2026-10" },
        { label: "November 2026", value: "2026-11" },
        { label: "December 2026", value: "2026-12" },
    ]

    const getMonthlyRealStats = () => {
        const [year, month] = selectedMonth.split("-").map(Number)
        const lastDay = new Date(year, month, 0).getDate()
        // Count weekdays (Mon–Fri) in the month
        let totalWorkingDays = 0
        for (let d = 1; d <= lastDay; d++) {
            const day = new Date(year, month - 1, d).getDay()
            if (day !== 0 && day !== 6) totalWorkingDays++
        }

        // Per-employee breakdown
        const empMap: Record<string, { name: string; email: string; dept: string; daysPresent: number; totalHours: number; uniqueDays: Set<string> }> = {}
        
        monthlyAttendance.forEach((record: any) => {
            const empId = record.userId || record.user?.id || record.user?.email || "unknown"
            const empName = record.user?.name || "Unknown"
            const empEmail = record.user?.email || ""
            const empDept = record.user?.department?.name || "Unassigned"
            const clockDate = format(new Date(record.clockIn), "yyyy-MM-dd")
            
            if (!empMap[empId]) {
                empMap[empId] = { name: empName, email: empEmail, dept: empDept, daysPresent: 0, totalHours: 0, uniqueDays: new Set() }
            }
            empMap[empId].uniqueDays.add(clockDate)
            empMap[empId].totalHours += Number(record.hoursWorked) || 0
        })

        const employeeStats = Object.entries(empMap).map(([id, emp]) => ({
            id,
            name: emp.name,
            email: emp.email,
            dept: emp.dept,
            daysPresent: emp.uniqueDays.size,
            totalHours: Math.round(emp.totalHours * 10) / 10,
            avgHours: emp.uniqueDays.size > 0 ? Math.round((emp.totalHours / emp.uniqueDays.size) * 10) / 10 : 0,
            daysAbsent: Math.max(0, totalWorkingDays - emp.uniqueDays.size),
            attendanceRate: totalWorkingDays > 0 ? Math.round((emp.uniqueDays.size / totalWorkingDays) * 100) : 0,
        }))

        // Also include employees with zero attendance
        employees.forEach(emp => {
            const found = Object.values(empMap).some(m => m.email === emp.email)
            if (!found) {
                employeeStats.push({
                    id: emp.id || emp.email,
                    name: emp.name,
                    email: emp.email,
                    dept: (emp as any).department?.name || "Unassigned",
                    daysPresent: 0,
                    totalHours: 0,
                    avgHours: 0,
                    daysAbsent: totalWorkingDays,
                    attendanceRate: 0
                })
            }
        })

        const totalCheckins = monthlyAttendance.length
        const avgRate = employeeStats.length > 0 
            ? Math.round(employeeStats.reduce((a, b) => a + b.attendanceRate, 0) / employeeStats.length)
            : 0
        const totalHoursAll = Math.round(employeeStats.reduce((a, b) => a + b.totalHours, 0) * 10) / 10
        const avgHoursAll = employeeStats.length > 0 
            ? Math.round((totalHoursAll / employeeStats.filter(e => e.daysPresent > 0).length || 0) * 10) / 10
            : 0

        return {
            totalWorkingDays,
            totalCheckins,
            attendanceRate: avgRate,
            totalHoursAll,
            avgHoursAll,
            employeeStats: employeeStats.sort((a, b) => b.daysPresent - a.daysPresent)
        }
    }

    const fetchReports = useCallback(async () => {
        setLoading(true)
        try {
            const todayStr = format(new Date(), "yyyy-MM-dd")
            const [usersRes, deptRes, leaveRes, todayAttRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?limit=ALL`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/departments`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves?status=PENDING`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/attendance?start=${todayStr}&end=${todayStr}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => null)
            ])

            const usersData = await usersRes.json()
            const deptData = await deptRes.json()
            const leaveData = await leaveRes.json().catch(() => [])
            const todayAttData = todayAttRes && todayAttRes.ok ? await todayAttRes.json() : []

            const users = Array.isArray(usersData) ? usersData : (usersData.users || [])
            const depts = Array.isArray(deptData) ? deptData : []
            const leaves = Array.isArray(leaveData) ? leaveData : (leaveData.leaves || [])

            setData({
                totalEmployees: users.length,
                presentToday: users.filter((u: any) => u.status === "ACTIVE").length,
                onLeave: leaves.filter((l: any) => l.status === "APPROVED").length,
                pendingLeaves: leaves.filter((l: any) => l.status === "PENDING").length,
                departments: depts.map((d: any, i: number) => ({
                    name: d.name,
                    staff: d._count?.users || 0,
                    attendance: Math.floor(87 + ((i * 4) % 12)),
                    leavedays: Math.floor((i * 3) % 9) + 1
                }))
            })
            setEmployees(users)
            setTodayAttendance(Array.isArray(todayAttData) ? todayAttData : [])
        } catch {
            toast.error("Failed to load report data")
        } finally {
            setLoading(false)
        }
    }, [token])

    const fetchEmployeeMonthly = useCallback(async (empId: string) => {
        if (empAttendance[empId]) return
        setLoadingEmpData(true)
        try {
            const now = new Date()
            const start = format(startOfMonth(now), "yyyy-MM-dd")
            const end = format(endOfMonth(now), "yyyy-MM-dd")
            const [attRes, leaveRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/attendance?start=${start}&end=${end}&userId=${empId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaves?userId=${empId}&status=APPROVED`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => null)
            ])
            const attData = attRes.ok ? await attRes.json() : []
            const leaveData = leaveRes?.ok ? await leaveRes.json() : []
            const leaveArr = Array.isArray(leaveData) ? leaveData : (leaveData.leaves || [])
            setEmpAttendance(prev => ({ ...prev, [empId]: Array.isArray(attData) ? attData : [] }))
            setEmpLeaves(prev => ({ ...prev, [empId]: leaveArr.length }))
        } catch {
            setEmpAttendance(prev => ({ ...prev, [empId]: [] }))
            setEmpLeaves(prev => ({ ...prev, [empId]: 0 }))
        } finally {
            setLoadingEmpData(false)
        }
    }, [token, empAttendance])

    const getEmpStats = (empId: string): EmpMonthlyStats => {
        const records = empAttendance[empId] || []
        const uniqueDays = new Set(records.map(r => format(new Date(r.clockIn), "yyyy-MM-dd")))
        const totalHours = records.reduce((a, r) => a + (Number(r.hoursWorked) || 0), 0)
        const lateDays = records.filter(r => {
            const h = new Date(r.clockIn).getHours()
            const m = new Date(r.clockIn).getMinutes()
            return h > 9 || (h === 9 && m > 15)
        }).length
        const presentDays = uniqueDays.size
        return {
            totalDays: new Date().getDate(),
            presentDays,
            lateDays,
            leaveDays: empLeaves[empId] || 0,
            totalHours: Math.round(totalHours * 10) / 10,
            avgHours: presentDays > 0 ? Math.round((totalHours / presentDays) * 10) / 10 : 0,
            records
        }
    }

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
        e.email.toLowerCase().includes(empSearch.toLowerCase())
    )
    const onMessage = useCallback((msg: any) => {
        if (msg.type === "DASHBOARD_STATS") {
            const p = msg.payload;
            setData({
                totalEmployees: p.totalEmployees,
                presentToday: p.activeToday,
                onLeave: p.leaveToday,
                pendingLeaves: p.pendingApprovals,
                departments: p.departmentMetrics || []
            });
        }
    }, []);

    const { status } = useWebSocket({ onMessage, enabled: !!token });

    const exportToPDF = async () => {
        const toastId = toast.loading("Generating executive report...");
        try {
            const autoTable = (await import("jspdf-autotable")).default;
            const pdf = new jsPDF("p", "mm", "a4");
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 16;
            const contentW = pageW - margin * 2;
            const reportDate = format(new Date(), "dd MMMM yyyy");
            const reportTime = format(new Date(), "hh:mm a");

            // ── HEADER BAR ──
            pdf.setFillColor(79, 70, 229); // indigo-600
            pdf.rect(0, 0, pageW, 38, "F");
            pdf.setFillColor(99, 102, 241); // lighter accent
            pdf.rect(0, 32, pageW, 6, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(22);
            pdf.setFont("helvetica", "bold");
            pdf.text("HRMS Executive Report", margin, 18);
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Generated: ${reportDate} at ${reportTime}`, margin, 26);
            pdf.text("Rudratic Technologies HR Management System", pageW - margin, 18, { align: "right" });
            pdf.text("Confidential Document", pageW - margin, 26, { align: "right" });

            let y = 48;

            // ── EXECUTIVE SUMMARY ──
            pdf.setTextColor(30, 41, 59); // slate-800
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text("Executive Summary", margin, y);
            y += 3;
            pdf.setDrawColor(79, 70, 229);
            pdf.setLineWidth(0.8);
            pdf.line(margin, y, margin + 45, y);
            y += 8;

            const attendanceRate = data.totalEmployees > 0
                ? Math.round((data.presentToday / data.totalEmployees) * 100) : 0;

            // KPI Cards
            const kpiData = [
                { label: "Total Employees", value: String(data.totalEmployees) },
                { label: "Attendance Rate", value: `${attendanceRate}%` },
                { label: "On Leave Today", value: String(data.onLeave) },
                { label: "Pending Approvals", value: String(data.pendingLeaves) },
            ];

            const cardW = (contentW - 9) / 4;
            kpiData.forEach((kpi, i) => {
                const x = margin + i * (cardW + 3);
                // Card background
                pdf.setFillColor(248, 250, 252); // slate-50
                pdf.roundedRect(x, y, cardW, 22, 3, 3, "F");
                // Border
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.3);
                pdf.roundedRect(x, y, cardW, 22, 3, 3, "S");
                // Value
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(18);
                pdf.setFont("helvetica", "bold");
                pdf.text(kpi.value, x + cardW / 2, y + 11, { align: "center" });
                // Label
                pdf.setTextColor(100, 116, 139);
                pdf.setFontSize(7);
                pdf.setFont("helvetica", "normal");
                pdf.text(kpi.label.toUpperCase(), x + cardW / 2, y + 18, { align: "center" });
            });
            y += 32;


            // ── EMPLOYEE DIRECTORY TABLE ──
            if (employees.length > 0) {
                if (y > pageH - 60) { pdf.addPage(); y = 20; }

                pdf.setTextColor(30, 41, 59);
                pdf.setFontSize(14);
                pdf.setFont("helvetica", "bold");
                pdf.text("Employee Directory", margin, y);
                y += 3;
                pdf.setDrawColor(79, 70, 229);
                pdf.setLineWidth(0.8);
                pdf.line(margin, y, margin + 45, y);
                y += 6;

                autoTable(pdf, {
                    startY: y,
                    margin: { left: margin, right: margin },
                    head: [["#", "Employee Name", "Email", "Department", "Status"]],
                    body: employees.slice(0, 50).map((emp, i) => [
                        String(i + 1),
                        emp.name,
                        emp.email,
                        (emp as any).department?.name || "—",
                        emp.status || "Active"
                    ]),
                    theme: "grid",
                    headStyles: {
                        fillColor: [30, 41, 59],
                        textColor: [255, 255, 255],
                        fontStyle: "bold",
                        fontSize: 8,
                        cellPadding: 4,
                        halign: "center",
                    },
                    bodyStyles: {
                        fontSize: 8,
                        cellPadding: 3.5,
                        textColor: [30, 41, 59],
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252],
                    },
                    columnStyles: {
                        0: { halign: "center", cellWidth: 10 },
                        1: { fontStyle: "bold" },
                        4: { halign: "center" },
                    },
                    didParseCell: (hookData: any) => {
                        if (hookData.section === "body" && hookData.column.index === 4) {
                            if (hookData.cell.raw === "ACTIVE") {
                                hookData.cell.styles.textColor = [5, 150, 105];
                                hookData.cell.styles.fontStyle = "bold";
                            }
                        }
                    }
                });
            }

            // ── FOOTER on each page ──
            const totalPages = pdf.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                // Footer line
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.3);
                pdf.line(margin, pageH - 14, pageW - margin, pageH - 14);
                // Footer text
                pdf.setFontSize(7);
                pdf.setTextColor(148, 163, 184);
                pdf.setFont("helvetica", "normal");
                pdf.text("HRMS Executive Report · Rudratic Technologies · Confidential", margin, pageH - 9);
                pdf.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 9, { align: "right" });
            }

            pdf.save(`HRMS_Executive_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
            toast.success("Executive report downloaded", { id: toastId });
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Report generation failed", { id: toastId });
        }
    };

    const exportDailyPDF = async () => {
        const toastId = toast.loading("Generating today's report...");
        try {
            const autoTable = (await import("jspdf-autotable")).default;
            const pdf = new jsPDF("p", "mm", "a4");
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 16;
            const contentW = pageW - margin * 2;
            
            const reportDate = format(new Date(), "dd MMMM yyyy");
            const reportTime = format(new Date(), "hh:mm a");

            // Header Banner
            pdf.setFillColor(15, 23, 42); // Dark State
            pdf.rect(0, 0, pageW, 38, "F");
            pdf.setFillColor(99, 102, 241); // indigo-600 accent
            pdf.rect(0, 32, pageW, 6, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.setFont("helvetica", "bold");
            pdf.text(`Daily Attendance Shard - ${reportDate}`, margin, 18);
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Generated: ${reportDate} at ${reportTime}`, margin, 26);
            pdf.text("Real-time Operational Document", pageW - margin, 18, { align: "right" });
            pdf.text("Rudratic Technologies", pageW - margin, 26, { align: "right" });

            let y = 48;

            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(13);
            pdf.setFont("helvetica", "bold");
            pdf.text("Workforce Operations Overview", margin, y);
            y += 3;
            pdf.setDrawColor(99, 102, 241);
            pdf.setLineWidth(0.8);
            pdf.line(margin, y, margin + 45, y);
            y += 8;

            const dailyRateVal = data.totalEmployees > 0 
                ? Math.round((todayAttendance.length / data.totalEmployees) * 100) 
                : 0;

            const kpis = [
                { label: "Active Today", value: String(todayAttendance.length) },
                { label: "Absences / Leave", value: String(data.onLeave) },
                { label: "Total Workforce", value: String(data.totalEmployees) },
                { label: "Daily Rate", value: `${dailyRateVal}%` },
            ];

            const cardW = (contentW - 9) / 4;
            kpis.forEach((kpi, i) => {
                const x = margin + i * (cardW + 3);
                pdf.setFillColor(248, 250, 252);
                pdf.roundedRect(x, y, cardW, 20, 2, 2, "F");
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.3);
                pdf.roundedRect(x, y, cardW, 20, 2, 2, "S");
                
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(15);
                pdf.setFont("helvetica", "bold");
                pdf.text(kpi.value, x + cardW / 2, y + 10, { align: "center" });
                
                pdf.setTextColor(100, 116, 139);
                pdf.setFontSize(7);
                pdf.setFont("helvetica", "normal");
                pdf.text(kpi.label.toUpperCase(), x + cardW / 2, y + 16, { align: "center" });
            });
            y += 30;

            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(13);
            pdf.setFont("helvetica", "bold");
            pdf.text("Today's Attendance Ledger", margin, y);
            y += 3;
            pdf.setDrawColor(99, 102, 241);
            pdf.setLineWidth(0.8);
            pdf.line(margin, y, margin + 45, y);
            y += 6;

            autoTable(pdf, {
                startY: y,
                margin: { left: margin, right: margin },
                head: [["#", "Employee Name", "Department", "Clock In", "Clock Out", "Total Hours"]],
                body: employees.map((emp, i) => {
                    const record = todayAttendance.find(r => r.user?.email === emp.email || (r as any).userId === emp.id);
                    return [
                        String(i + 1),
                        emp.name,
                        (emp as any).department?.name || "Unassigned",
                        record ? format(new Date(record.clockIn), "HH:mm") : "—",
                        record ? (record.clockOut ? format(new Date(record.clockOut), "HH:mm") : "Active") : "—",
                        record ? (record.hoursWorked ? Number(record.hoursWorked).toFixed(1) + "h" : "Active") : "—"
                    ];
                }),
                theme: "grid",
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 8,
                    cellPadding: 4,
                },
                bodyStyles: {
                    fontSize: 8,
                    cellPadding: 3.5,
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                }
            });

            pdf.setPage(1);
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.3);
            pdf.line(margin, pageH - 14, pageW - margin, pageH - 14);
            pdf.setFontSize(7);
            pdf.setTextColor(148, 163, 184);
            pdf.text(`Rudratic HRMS · Daily Report (${reportDate}) · Confidential`, margin, pageH - 9);
            pdf.text(`Page 1 of 1`, pageW - margin, pageH - 9, { align: "right" });

            pdf.save(`Daily_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
            toast.success("Daily report downloaded successfully", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate Daily PDF", { id: toastId });
        }
    };

    const exportMonthlyPDF = async () => {
        const toastId = toast.loading("Generating monthly report...");
        try {
            const autoTable = (await import("jspdf-autotable")).default;
            const pdf = new jsPDF("p", "mm", "a4");
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 16;
            const contentW = pageW - margin * 2;
            
            const monthObj = monthsList.find(m => m.value === selectedMonth);
            const monthLabel = monthObj ? monthObj.label : selectedMonth;
            const reportDate = format(new Date(), "dd MMMM yyyy");
            const reportTime = format(new Date(), "hh:mm a");

            const stats = getMonthlyRealStats();

            // Header Banner
            pdf.setFillColor(99, 102, 241);
            pdf.rect(0, 0, pageW, 38, "F");
            pdf.setFillColor(79, 70, 229);
            pdf.rect(0, 32, pageW, 6, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.setFont("helvetica", "bold");
            pdf.text(`Monthly Attendance - ${monthLabel}`, margin, 18);
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.text(`Generated: ${reportDate} at ${reportTime}`, margin, 26);
            pdf.text("Confidential Executive Report", pageW - margin, 18, { align: "right" });
            pdf.text("Rudratic Technologies", pageW - margin, 26, { align: "right" });

            let y = 48;

            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(13);
            pdf.setFont("helvetica", "bold");
            pdf.text("Monthly Summary", margin, y);
            y += 3;
            pdf.setDrawColor(99, 102, 241);
            pdf.setLineWidth(0.8);
            pdf.line(margin, y, margin + 45, y);
            y += 8;

            const kpis = [
                { label: "Staff Count", value: String(data.totalEmployees) },
                { label: "Working Days", value: String(stats.totalWorkingDays) },
                { label: "Avg Attendance", value: `${stats.attendanceRate}%` },
                { label: "Avg Hours/Day", value: `${stats.avgHoursAll}h` },
            ];

            const cardW = (contentW - 9) / 4;
            kpis.forEach((kpi, i) => {
                const x = margin + i * (cardW + 3);
                pdf.setFillColor(248, 250, 252);
                pdf.roundedRect(x, y, cardW, 20, 2, 2, "F");
                pdf.setDrawColor(226, 232, 240);
                pdf.setLineWidth(0.3);
                pdf.roundedRect(x, y, cardW, 20, 2, 2, "S");
                
                pdf.setTextColor(15, 23, 42);
                pdf.setFontSize(15);
                pdf.setFont("helvetica", "bold");
                pdf.text(kpi.value, x + cardW / 2, y + 10, { align: "center" });
                
                pdf.setTextColor(100, 116, 139);
                pdf.setFontSize(7);
                pdf.setFont("helvetica", "normal");
                pdf.text(kpi.label.toUpperCase(), x + cardW / 2, y + 16, { align: "center" });
            });
            y += 30;

            pdf.setTextColor(30, 41, 59);
            pdf.setFontSize(13);
            pdf.setFont("helvetica", "bold");
            pdf.text("Employee Attendance Breakdown", margin, y);
            y += 3;
            pdf.setDrawColor(99, 102, 241);
            pdf.setLineWidth(0.8);
            pdf.line(margin, y, margin + 45, y);
            y += 6;

            autoTable(pdf, {
                startY: y,
                margin: { left: margin, right: margin },
                head: [["#", "Employee", "Dept", "Days Present", "Days Absent", "Total Hours", "Avg Hrs/Day", "Rate"]],
                body: stats.employeeStats.map((emp, i) => [
                    String(i + 1),
                    emp.name,
                    emp.dept,
                    String(emp.daysPresent),
                    String(emp.daysAbsent),
                    `${emp.totalHours}h`,
                    `${emp.avgHours}h`,
                    `${emp.attendanceRate}%`
                ]),
                theme: "grid",
                headStyles: {
                    fillColor: [30, 41, 59],
                    textColor: [255, 255, 255],
                    fontStyle: "bold",
                    fontSize: 7,
                    cellPadding: 3,
                },
                bodyStyles: {
                    fontSize: 7,
                    cellPadding: 2.5,
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                }
            });

            pdf.setPage(1);
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.3);
            pdf.line(margin, pageH - 14, pageW - margin, pageH - 14);
            pdf.setFontSize(7);
            pdf.setTextColor(148, 163, 184);
            pdf.text(`Rudratic HRMS · Monthly Report (${monthLabel}) · Confidential`, margin, pageH - 9);
            pdf.text(`Page 1 of 1`, pageW - margin, pageH - 9, { align: "right" });

            pdf.save(`Monthly_Report_${selectedMonth}.pdf`);
            toast.success("Monthly report downloaded successfully", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PDF", { id: toastId });
        }
    };

    useEffect(() => { fetchReports() }, [fetchReports])

    const attendanceRate = data.totalEmployees > 0
        ? Math.round((data.presentToday / data.totalEmployees) * 100)
        : 0

    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    })

    const kpis = [
        { label: "Total Employees", value: data.totalEmployees, suffix: "", sub: "+2 this month", icon: Users, accent: "#1e40af", bg: "bg-[#eff6ff]" },
        { label: "Attendance Rate", value: attendanceRate, suffix: "%", sub: "Good standing", icon: UserCheck, accent: "#166534", bg: "bg-[#f0fdf4]" },
        { label: "On Leave Today", value: data.onLeave, suffix: "", sub: "Approved absences", icon: Calendar, accent: "#92400e", bg: "bg-[#fffbeb]" },
        { label: "Pending Approvals", value: data.pendingLeaves, suffix: "", sub: "All clear", icon: AlertCircle, accent: "#dc2626", bg: "bg-[#fef2f2]" },
    ]

    return (
        <div className="min-h-full bg-[#fcfcfd] font-body pb-20 relative overflow-hidden">
            {/* Subtle Background Accent */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />
            
            <GlobalStyles />
            <div className="max-w-[1400px] mx-auto px-6 py-10 space-y-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                            <BarChart3 className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-[26px] font-bold text-slate-800 tracking-tight font-brand leading-none">
                                Reports & Analytics
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">
                                {data.totalEmployees} Active · {today}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className={cn(
                            "flex items-center gap-2 px-4 h-11 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm",
                            status === "connected" ? "bg-white border-emerald-100 text-emerald-600" : "bg-white border-slate-100 text-slate-400"
                        )}>
                            <div className={cn("w-2 h-2 rounded-full", status === "connected" ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                            {status === "connected" ? "Live Stream" : "System Offline"}
                        </div>

                        <button onClick={fetchReports} className="h-11 px-6 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
                            <RefreshCcw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                            Sync
                        </button>
                        
                        <button onClick={() => setIsDailyModalOpen(true)} className="h-11 px-5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-indigo-500" />
                            Daily Report
                        </button>
                        
                        <button onClick={() => setIsMonthlyModalOpen(true)} className="h-11 px-5 bg-white border border-violet-200 text-violet-600 hover:bg-violet-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2">
                            <CalendarRange className="w-4 h-4 text-violet-500" />
                            Monthly Report
                        </button>

                        <button onClick={exportToPDF} className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
                            <Download className="w-3.5 h-3.5" />
                            Download Executive
                        </button>
                    </div>
                </div>

                <div id="reports-manifest" className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {kpis.map((kpi, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-8 rounded-[28px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", kpi.bg)}>
                                        <kpi.icon className="w-5 h-5" style={{ color: kpi.accent }} />
                                    </div>
                                    <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">{loading ? "—" : kpi.value}{kpi.suffix}</h2>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{kpi.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>


                    {/* ── EMPLOYEE DIRECTORY ── */}
                    <div className="space-y-6 pt-4">
                        {/* Premium Header Card */}
                        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 rounded-[32px] p-8 relative overflow-hidden shadow-2xl shadow-indigo-200">
                            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -mr-36 -mt-36 blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24 blur-2xl" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[20px] flex items-center justify-center shadow-lg">
                                        <Users className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-[22px] font-bold text-white tracking-tight font-brand leading-none">Employee Directory</h3>
                                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] mt-2">{employees.length} Staff Members · Monthly Overview</p>
                                    </div>
                                </div>
                                {/* Search */}
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={empSearch}
                                        onChange={e => setEmpSearch(e.target.value)}
                                        className="w-full h-12 pl-11 pr-10 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl text-sm font-medium text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all"
                                    />
                                    {empSearch && (
                                        <button onClick={() => setEmpSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Employee List */}
                        <div className="space-y-3">
                            <AnimatePresence>
                                {filteredEmployees.map((emp, idx) => {
                                    const isExpanded = expandedEmp === emp.id
                                    const stats = isExpanded ? getEmpStats(emp.id) : null
                                    const monthName = format(new Date(), "MMMM yyyy")
                                    const avatarColors = [
                                        "from-indigo-500 to-blue-600 shadow-indigo-200",
                                        "from-violet-500 to-purple-600 shadow-violet-200",
                                        "from-emerald-500 to-teal-600 shadow-emerald-200",
                                        "from-rose-500 to-pink-600 shadow-rose-200",
                                        "from-amber-500 to-orange-600 shadow-amber-200",
                                        "from-cyan-500 to-blue-600 shadow-cyan-200",
                                    ]
                                    const avatarColor = avatarColors[idx % avatarColors.length]

                                    return (
                                        <motion.div
                                            key={emp.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className={cn("bg-white border rounded-[28px] overflow-hidden transition-all", isExpanded ? "border-indigo-200 shadow-xl shadow-indigo-100/40" : "border-slate-100 hover:shadow-lg hover:shadow-slate-200/40")}
                                        >
                                            {/* Employee Row */}
                                            <button
                                                onClick={() => {
                                                    const newId = isExpanded ? null : emp.id
                                                    setExpandedEmp(newId)
                                                    if (newId) fetchEmployeeMonthly(newId)
                                                }}
                                                className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn("w-12 h-12 bg-gradient-to-br rounded-[16px] flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0", avatarColor)}>
                                                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-slate-900 tracking-tight">{emp.name}</p>
                                                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{emp.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge className={cn(
                                                        "text-[9px] font-bold uppercase tracking-widest border-none px-3 py-1 rounded-full",
                                                        emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {emp.status || "Active"}
                                                    </Badge>
                                                    {(emp as any).department?.name && (
                                                        <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-bold px-3 py-1 rounded-full">
                                                            {(emp as any).department.name}
                                                        </Badge>
                                                    )}
                                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                                                </div>
                                            </button>

                                            {/* Expanded Monthly Stats */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-6 pb-8 pt-2 border-t border-slate-100">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                                                                Monthly Summary · {monthName}
                                                            </p>

                                                            {loadingEmpData && !empAttendance[emp.id] ? (
                                                                <div className="flex items-center justify-center py-10 gap-3">
                                                                    <RefreshCcw className="w-4 h-4 animate-spin text-indigo-500" />
                                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loading data...</span>
                                                                </div>
                                                            ) : stats && (
                                                                <>
                                                                    {/* Stats Grid */}
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                                                                        {[
                                                                            { label: "Days in Month", value: stats.totalDays, color: "text-slate-700", bg: "bg-slate-50" },
                                                                            { label: "Present", value: stats.presentDays, color: "text-emerald-600", bg: "bg-emerald-50" },
                                                                            { label: "Leaves", value: stats.leaveDays, color: "text-rose-600", bg: "bg-rose-50" },
                                                                            { label: "Total Hours", value: `${stats.totalHours}h`, color: "text-indigo-600", bg: "bg-indigo-50" },
                                                                            { label: "Avg Hours/Day", value: `${stats.avgHours}h`, color: "text-violet-600", bg: "bg-violet-50" },
                                                                        ].map((s, si) => (
                                                                            <div key={si} className={cn("p-4 rounded-[20px] border border-slate-100 text-center", s.bg)}>
                                                                                <p className="text-2xl font-bold tracking-tight mb-1" style={{ color: undefined }}>
                                                                                    <span className={s.color}>{s.value}</span>
                                                                                </p>
                                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {/* Recent Records */}
                                                                    {stats.records.length > 0 && (
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3 px-1">Attendance Log</p>
                                                                            <div className="bg-slate-50/50 rounded-[20px] border border-slate-100 overflow-hidden">
                                                                                <table className="w-full text-left">
                                                                                    <thead>
                                                                                        <tr className="border-b border-slate-100">
                                                                                            <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                                                                            <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clock In</th>
                                                                                            <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Clock Out</th>
                                                                                            <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                                                                            <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Hours</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {stats.records.slice(0, 10).map((r, ri) => {
                                                                                            const clockInDate = new Date(r.clockIn)
                                                                                            const isLate = clockInDate.getHours() > 9 || (clockInDate.getHours() === 9 && clockInDate.getMinutes() > 15)
                                                                                            return (
                                                                                                <tr key={ri} className="border-b border-slate-100/50 last:border-0 hover:bg-white transition-colors">
                                                                                                    <td className="px-5 py-3 text-[12px] font-bold text-slate-700">{format(clockInDate, "dd MMM")}</td>
                                                                                                    <td className="px-5 py-3">
                                                                                                        <span className={cn("text-[11px] font-bold font-mono px-2.5 py-1 rounded-lg", isLate ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
                                                                                                            {format(clockInDate, "HH:mm")}
                                                                                                        </span>
                                                                                                        {isLate && <span className="ml-2 text-[8px] font-bold text-amber-500 uppercase">Late</span>}
                                                                                                    </td>
                                                                                                    <td className="px-5 py-3">
                                                                                                        {r.clockOut ? (
                                                                                                            <span className="text-[11px] font-bold font-mono px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600">{format(new Date(r.clockOut), "HH:mm")}</span>
                                                                                                        ) : (
                                                                                                            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                                                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Active
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="px-5 py-3">
                                                                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{r.clockType}</span>
                                                                                                    </td>
                                                                                                    <td className="px-5 py-3 text-right">
                                                                                                        <span className="text-[12px] font-bold text-slate-700">{r.hoursWorked ? Number(r.hoursWorked).toFixed(1) + "h" : "—"}</span>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            )
                                                                                        })}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                            {stats.records.length > 10 && (
                                                                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-3 text-center">
                                                                                    Showing 10 of {stats.records.length} records
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {stats.records.length === 0 && (
                                                                        <div className="py-10 text-center">
                                                                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No attendance records this month</p>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>

                            {filteredEmployees.length === 0 && !loading && (
                                <div className="py-16 text-center">
                                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                                    <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">No employees found</p>
                                </div>
                            )}
                        </div>
                    </div>

            {/* ── DAILY REPORT MODAL ── */}
            <Dialog open={isDailyModalOpen} onOpenChange={setIsDailyModalOpen}>
                <DialogContent className="max-w-2xl bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl overflow-hidden font-body">
                    <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight font-brand flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        Daily Operational Shard
                    </DialogTitle>
                    <DialogDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Active Analytics for {today}
                    </DialogDescription>
                    
                    <div className="mt-6 space-y-6">
                        {/* Daily Stats Grid */}
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { label: "Active Today", value: todayAttendance.length, color: "text-emerald-600", bg: "bg-emerald-50/50" },
                                { label: "On Leave", value: data.onLeave, color: "text-amber-600", bg: "bg-amber-50/50" },
                                { label: "Workforce", value: data.totalEmployees, color: "text-slate-800", bg: "bg-slate-50" },
                                { label: "Daily Rate", value: `${data.totalEmployees > 0 ? Math.round((todayAttendance.length / data.totalEmployees) * 100) : 0}%`, color: "text-indigo-600", bg: "bg-indigo-50/50" }
                            ].map((s, idx) => (
                                <div key={idx} className={cn("p-4 rounded-2xl border border-slate-100 text-center", s.bg)}>
                                    <p className="text-xl font-bold tracking-tight mb-1"><span className={s.color}>{s.value}</span></p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Active Staff list preview */}
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Today's Attendance Logs (Real-time)</p>
                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl bg-slate-50/30">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 sticky top-0 bg-slate-100/80 backdrop-blur-md">
                                            <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                                            <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Department</th>
                                            <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Clock In</th>
                                            <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Clock Out</th>
                                            <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Intensity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp, idx) => {
                                            const record = todayAttendance.find(r => r.user?.email === emp.email || (r as any).userId === emp.id);
                                            const hasClockedIn = !!record;
                                            
                                            return (
                                                <tr key={emp.id || idx} className="border-b border-slate-100/50 last:border-0 hover:bg-white transition-colors">
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{emp.name}</td>
                                                    <td className="px-4 py-3 text-[11px] text-slate-400">{(emp as any).department?.name || "Unassigned"}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {hasClockedIn ? (
                                                            <span className="text-[11px] font-bold font-mono px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                                                                {format(new Date(record.clockIn), "HH:mm")}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-bold text-slate-300 font-mono">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {hasClockedIn ? (
                                                            record.clockOut ? (
                                                                <span className="text-[11px] font-bold font-mono px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg">
                                                                    {format(new Date(record.clockOut), "HH:mm")}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-lg">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    Active
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-[11px] font-bold text-slate-300 font-mono">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {hasClockedIn ? (
                                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                {record.hoursWorked ? Number(record.hoursWorked).toFixed(1) + "h" : "Active"}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-bold text-slate-300 font-mono">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setIsDailyModalOpen(false)} className="h-11 px-5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                Close
                            </button>
                            <button onClick={exportDailyPDF} className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
                                <Download className="w-3.5 h-3.5" />
                                Export Daily PDF
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── MONTHLY REPORT MODAL ── */}
            <Dialog open={isMonthlyModalOpen} onOpenChange={setIsMonthlyModalOpen}>
                <DialogContent className="max-w-4xl bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl overflow-hidden font-body">
                    <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight font-brand flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                            <CalendarRange className="w-5 h-5" />
                        </div>
                        Monthly Attendance Report
                    </DialogTitle>
                    <DialogDescription className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Real-Time Employee Attendance Breakdown
                    </DialogDescription>
                    
                    <div className="mt-6 space-y-6">
                        {/* Month Filter selector */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-xs font-bold text-slate-700">Select Month</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Data fetched from live attendance records</p>
                            </div>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="h-10 px-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-violet-500 shadow-sm"
                            >
                                {monthsList.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>

                        {monthlyFilterLoading ? (
                            <div className="h-[320px] flex flex-col items-center justify-center gap-4">
                                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Fetching Attendance Records...</p>
                            </div>
                        ) : (() => {
                            const stats = getMonthlyRealStats()
                            return (
                            <div className="space-y-6">
                                {/* Monthly Stats Grid */}
                                <div className="grid grid-cols-5 gap-3">
                                    {[
                                        { label: "Staff Count", value: data.totalEmployees, color: "text-slate-800", bg: "bg-slate-50" },
                                        { label: "Working Days", value: stats.totalWorkingDays, color: "text-indigo-600", bg: "bg-indigo-50/50" },
                                        { label: "Total Check-ins", value: stats.totalCheckins, color: "text-emerald-600", bg: "bg-emerald-50/50" },
                                        { label: "Avg Attendance", value: `${stats.attendanceRate}%`, color: "text-violet-600", bg: "bg-violet-50/50" },
                                        { label: "Avg Hours/Day", value: `${stats.avgHoursAll}h`, color: "text-amber-600", bg: "bg-amber-50/50" }
                                    ].map((s, idx) => (
                                        <div key={idx} className={cn("p-3.5 rounded-2xl border border-slate-100 text-center", s.bg)}>
                                            <p className="text-lg font-bold tracking-tight mb-0.5"><span className={s.color}>{s.value}</span></p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Per-Employee Attendance Breakdown */}
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Employee Attendance Breakdown</p>
                                    <div className="max-h-[280px] overflow-y-auto custom-scrollbar border border-slate-100 rounded-2xl bg-slate-50/30">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 sticky top-0 bg-slate-100/80 backdrop-blur-md z-10">
                                                    <th className="px-4 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                                    <th className="px-3 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dept</th>
                                                    <th className="px-3 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Days Present</th>
                                                    <th className="px-3 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Days Absent</th>
                                                    <th className="px-3 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Total Hours</th>
                                                    <th className="px-3 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Avg Hrs/Day</th>
                                                    <th className="px-3 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.employeeStats.map((emp, idx) => (
                                                    <tr key={emp.id || idx} className="border-b border-slate-100/50 last:border-0 hover:bg-white transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-700">{emp.name}</p>
                                                                <p className="text-[9px] text-slate-400 font-mono">{emp.email}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-[11px] text-slate-500">{emp.dept}</td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                                {emp.daysPresent}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md", emp.daysAbsent > 5 ? "text-rose-600 bg-rose-50" : "text-slate-500 bg-slate-100")}>
                                                                {emp.daysAbsent}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className="text-xs font-bold text-slate-600">{emp.totalHours}h</span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className="text-xs font-bold text-indigo-600">{emp.avgHours}h</span>
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className={cn("h-full rounded-full transition-all", emp.attendanceRate >= 80 ? "bg-emerald-500" : emp.attendanceRate >= 50 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${emp.attendanceRate}%` }} />
                                                                </div>
                                                                <span className={cn("text-xs font-bold", emp.attendanceRate >= 80 ? "text-emerald-600" : emp.attendanceRate >= 50 ? "text-amber-600" : "text-rose-600")}>
                                                                    {emp.attendanceRate}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {stats.employeeStats.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="px-4 py-10 text-center">
                                                            <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No attendance records found for this month</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            )
                        })()}

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => setIsMonthlyModalOpen(false)} className="h-11 px-5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                Close
                            </button>
                            <button onClick={exportMonthlyPDF} disabled={monthlyFilterLoading} className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50">
                                <Download className="w-3.5 h-3.5" />
                                Export Monthly PDF
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

                </div>
            </div>
        </div>
    )
}
