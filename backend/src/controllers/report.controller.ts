import { Request, Response } from 'express';
import * as timeEntryService from '../services/timeEntry.service';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getReportContext = async (req: Request) => {
    const { userId: queryUserId } = req.query;
    const loggedInUser = (req as AuthRequest).user;

    if (!loggedInUser?.id || !loggedInUser?.companyId) return null;

    let targetUserId: string | undefined = loggedInUser.id;
    let targetDepartment: string | undefined = undefined;

    // Use full user and role to determine permissions
    const user = await prisma.user.findUnique({
        where: { id: loggedInUser.id },
        include: { role: true, department: true }
    });

    const roleName = user?.role?.name;

    if (roleName === 'ADMIN' || roleName === 'COMPANY_ADMIN' || roleName === 'SUPER_ADMIN') {
        targetUserId = queryUserId ? (queryUserId as string) : undefined;
    } else {
        targetUserId = loggedInUser.id;
    }

    return { companyId: loggedInUser.companyId, targetUserId, targetDepartment };
};

export const getAttendanceReport = async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required' });

        const ctx = await getReportContext(req);
        if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

        const report = await timeEntryService.getReport(
            ctx.companyId,
            new Date(start as string),
            new Date(end as string),
            ctx.targetUserId,
            ctx.targetDepartment
        );
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const exportExcel = async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required' });

        const ctx = await getReportContext(req);
        if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

        const report = await timeEntryService.getReport(
            ctx.companyId,
            new Date(start as string),
            new Date(end as string),
            ctx.targetUserId,
            ctx.targetDepartment
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');

        worksheet.columns = [
            { header: 'Employee', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Clock In', key: 'clockIn', width: 20 },
            { header: 'Clock Out', key: 'clockOut', width: 20 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Hours Worked', key: 'hours', width: 15 },
        ];

        report.forEach((entry: any) => {
            worksheet.addRow({
                name: entry.user?.name || 'Unknown',
                email: entry.user?.email || 'N/A',
                date: entry.clockIn.toISOString().split('T')[0],
                clockIn: entry.clockIn.toLocaleTimeString(),
                clockOut: entry.clockOut ? entry.clockOut.toLocaleTimeString() : 'N/A',
                type: entry.clockType,
                hours: entry.hoursWorked ? Number(entry.hoursWorked).toFixed(2) : '0.00'
            });
        });

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_Report_${start}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const exportPDF = async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required' });

        const ctx = await getReportContext(req);
        if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

        const report = await timeEntryService.getReport(
            ctx.companyId,
            new Date(start as string),
            new Date(end as string),
            ctx.targetUserId,
            ctx.targetDepartment
        );

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Attendance Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Period: ${start} to ${end}`, 14, 30);

        const tableData = report.map((entry: any) => [
            entry.user?.name || 'Unknown',
            entry.clockIn.toISOString().split('T')[0],
            entry.clockIn.toLocaleTimeString(),
            entry.clockOut ? entry.clockOut.toLocaleTimeString() : 'N/A',
            entry.clockType,
            entry.hoursWorked ? Number(entry.hoursWorked).toFixed(2) : '0.00'
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Employee', 'Date', 'Clock In', 'Clock Out', 'Type', 'Hours']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241] }
        });

        const pdfOutput = doc.output();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Attendance_Report_${start}.pdf`);
        res.send(Buffer.from(pdfOutput as any, 'binary'));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const exportStrategicMonthly = async (req: Request, res: Response) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'Start and end dates are required' });

        const ctx = await getReportContext(req);
        if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

        const allReport = await timeEntryService.getReport(
            ctx.companyId,
            new Date(start as string),
            new Date(end as string),
            ctx.targetUserId,
            ctx.targetDepartment
        );

        // Include both completed and active entries for a comprehensive strategic view
        // Calculations will safely handle null hoursWorked for active sessions
        const report = allReport;

        const workbook = new ExcelJS.Workbook();
        
        // --- SHEET 1: EXECUTIVE SUMMARY ---
        const summarySheet = workbook.addWorksheet('Strategic Overview');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 },
            { header: 'Insight', key: 'insight', width: 50 },
        ];

        const totalHours = report.reduce((acc, curr) => acc + (Number(curr.hoursWorked) || 0), 0);
        const uniqueEmployees = new Set(report.map(e => e.userId)).size;
        const totalEntries = report.length;
        const remoteEntries = report.filter(e => e.clockType === 'REMOTE').length;
        const officeEntries = report.filter(e => e.clockType === 'IN_OFFICE').length;

        summarySheet.addRows([
            { metric: 'Analysis Period', value: `${start} to ${end}`, insight: 'Timespan covered by this intelligence report.' },
            { metric: 'Active Personnel Count', value: uniqueEmployees, insight: 'Number of unique staff members with recorded activity.' },
            { metric: 'Aggregate Labor Hours', value: totalHours.toFixed(2), insight: 'Total productive hours across the organization.' },
            { metric: 'Average Hours Per Staff', value: uniqueEmployees > 0 ? (totalHours / uniqueEmployees).toFixed(2) : 0, insight: 'Mean workload distribution per individual.' },
            { metric: 'Remote Work Utilization', value: totalEntries > 0 ? ((remoteEntries / totalEntries) * 100).toFixed(1) + '%' : '0%', insight: 'Percentage of work performed outside the primary office.' },
            { metric: 'Office Presence Rate', value: totalEntries > 0 ? ((officeEntries / totalEntries) * 100).toFixed(1) + '%' : '0%', insight: 'Percentage of on-site operations.' },
        ]);

        summarySheet.getRow(1).font = { bold: true, size: 12 };
        summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        summarySheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // --- SHEET 2: PERSONNEL INTENSITY ---
        const personnelSheet = workbook.addWorksheet('Personnel Analytics');
        personnelSheet.columns = [
            { header: 'Staff Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Total Hours', key: 'hours', width: 15 },
            { header: 'Avg Hours/Entry', key: 'avg', width: 20 },
            { header: 'Record Count', key: 'count', width: 15 },
        ];

        const personnelStats = report.reduce((acc: any, curr: any) => {
            if (!curr.userId) return acc;
            if (!acc[curr.userId]) {
                acc[curr.userId] = { 
                    name: curr.user?.name || 'Personnel Node', 
                    email: curr.user?.email || 'N/A', 
                    hours: 0, 
                    count: 0 
                };
            }
            acc[curr.userId].hours += (Number(curr.hoursWorked) || 0);
            acc[curr.userId].count += 1;
            return acc;
        }, {});

        Object.values(personnelStats).sort((a: any, b: any) => b.hours - a.hours).forEach((p: any) => {
            personnelSheet.addRow({
                name: p.name,
                email: p.email,
                hours: p.hours.toFixed(2),
                avg: p.count > 0 ? (p.hours / p.count).toFixed(2) : 0,
                count: p.count
            });
        });

        personnelSheet.getRow(1).font = { bold: true };
        personnelSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        personnelSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // --- SHEET 3: DEPARTMENTAL BREAKDOWN ---
        const deptSheet = workbook.addWorksheet('Departmental Intelligence');
        deptSheet.columns = [
            { header: 'Department', key: 'dept', width: 30 },
            { header: 'Aggregated Hours', key: 'hours', width: 20 },
            { header: 'Resource Count', key: 'staff', width: 20 },
        ];

        const deptStats = report.reduce((acc: any, curr: any) => {
            const dept = curr.user?.department?.name || 'Unassigned';
            if (!acc[dept]) acc[dept] = { hours: 0, staff: new Set() };
            acc[dept].hours += (Number(curr.hoursWorked) || 0);
            acc[dept].staff.add(curr.userId);
            return acc;
        }, {});

        Object.entries(deptStats).forEach(([dept, stat]: any) => {
            deptSheet.addRow({
                dept: dept,
                hours: stat.hours.toFixed(2),
                staff: stat.staff.size
            });
        });

        deptSheet.getRow(1).font = { bold: true };
        deptSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
        deptSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Strategic_Analysis_Report_${new Date().getTime()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        console.error('Strategic Export Failure:', error);
        res.status(500).json({ error: error.message || 'Analysis Generation Failure' });
    }
};
