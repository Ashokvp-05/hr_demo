import prisma from '../config/db';
import cache from '../config/cache';
import path from 'path';
import fs from 'fs';
import { PayrollStatus, NotificationType } from '@prisma/client';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createNotification } from './notification.service';
import { logAction } from './audit.service';
import { supabase, STORAGE_BUCKET } from '../config/supabase';
import * as timeService from './timeEntry.service';
import * as holidayService from './holiday.service';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads/payslips');

export const generatePayslipFromTemplate = async (
    userId: string,
    month: string,
    year: number,
    amount: number,
    breakdown?: {
        hra?: number;
        da?: number;
        bonus?: number;
        otherAllowances?: number;
        pf?: number;
        tax?: number;
    }
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            department: { select: { name: true } },
            designation: { select: { name: true } },
            joiningDate: true,
            companyId: true
        }
    });

    if (!user) throw new Error("User not found");
    if (!user.companyId) throw new Error("User is not associated with any company");

    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo-600
    const secondaryColor: [number, number, number] = [248, 250, 252]; // Slate-50
    const borderColor: [number, number, number] = [226, 232, 240]; // Slate-200
    const textColor: [number, number, number] = [15, 23, 42]; // Slate-900

    // 1. Header Section
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("RUDRATIC HR", 15, 20);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("SECURE ENTERPRISE PAYROLL SYSTEM", 15, 26);

    doc.setFontSize(9);
    doc.text(`PAYSLIP NO: SLP-${year}${month.substring(0, 3).toUpperCase()}-${user.id.substring(0, 4)}`, 150, 15);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 150, 20);

    // 2. Title Section
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`MONTHLY PAY SLIP | ${month.toUpperCase()} ${year}`, 15, 50);

    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(15, 55, 195, 55);

    // 3. Employee & Work Details (Grid)
    doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.rect(15, 60, 90, 45, 'F'); // Employee Block
    doc.rect(110, 60, 85, 45, 'F'); // Work Block

    // Employee Labels
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("EMPLOYEE NAME", 20, 68);
    doc.text("EMPLOYEE ID", 20, 78);
    doc.text("DEPARTMENT", 20, 88);
    doc.text("DESIGNATION", 20, 98);

    doc.text("DAYS PRESENT", 115, 68);
    doc.text("PAID HOLIDAYS", 115, 78);
    doc.text("LEAVE WITHOUT PAY", 115, 88);
    doc.text("NET PAYABLE DAYS", 115, 98);

    // 3. Dynamic Work Details
    const workStats = await timeService.getMonthlyWorkStats(userId, user.companyId, month, year);
    const allHolidays = await holidayService.getHolidays(year, user.companyId);

    // Filter holidays for the specific month
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(month);
    const monthHolidays = (allHolidays as any[]).filter((h: any) => new Date(h.date).getMonth() === monthIndex);

    // Employee Values
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(user.name.toUpperCase(), 50, 68);
    doc.text(user.id.substring(0, 8).toUpperCase(), 50, 78);
    doc.text(user.department?.name || "GENERAL", 50, 88);
    doc.text(user.designation?.name || "STAFF", 50, 98);

    doc.text(workStats.daysWorked.toString(), 160, 68);
    doc.text(monthHolidays.length.toString(), 160, 78);
    doc.text("0", 160, 88); // TODO: Fetch from actual leave service
    doc.text(`${workStats.daysWorked + monthHolidays.length} / ${workStats.totalDays}`, 160, 98);

    // 4. Financial Breakdown Tables
    const hra = breakdown?.hra || 0;
    const da = breakdown?.da || 0;
    const bonus = breakdown?.bonus || 0;
    const other = breakdown?.otherAllowances || 0;
    const pf = breakdown?.pf || 0;
    const tax = breakdown?.tax || 0;
    const basic = amount - hra - da - bonus - other + pf + tax;

    autoTable(doc, {
        startY: 115,
        margin: { left: 15, right: 110 },
        head: [['EARNINGS DESCRIPTION', 'AMOUNT']],
        body: [
            ['BASIC SALARY', `$ ${basic.toLocaleString()}`],
            ['HOUSE RENT ALLOWANCE', `$ ${hra.toLocaleString()}`],
            ['DEARNESS ALLOWANCE', `$ ${da.toLocaleString()}`],
            ['PERFORMANCE BONUS', `$ ${bonus.toLocaleString()}`],
            ['OTHER ALLOWANCES', `$ ${other.toLocaleString()}`],
        ],
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: textColor },
        theme: 'grid'
    });

    autoTable(doc, {
        startY: 115,
        margin: { left: 110, right: 15 },
        head: [['DEDUCTIONS DESCRIPTION', 'AMOUNT']],
        body: [
            ['PROVIDENT FUND (PF)', `$ ${pf.toLocaleString()}`],
            ['INCOME TAX (TDS)', `$ ${tax.toLocaleString()}`],
            ['PROFESSIONAL TAX', '$ 0'],
            ['LOAN REPAYMENT', '$ 0'],
            ['TOTAL DEDUCTIONS', `$ ${(pf + tax).toLocaleString()}`],
        ],
        headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: textColor },
        theme: 'grid'
    });

    // 5. Net Pay Highlight Section
    const tablesEndY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(110, tablesEndY, 85, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("TOTAL NET PAYABLE", 115, tablesEndY + 10);
    doc.setFontSize(18);
    doc.text(`$ ${amount.toLocaleString()}`, 115, tablesEndY + 20);

    // 6. Signatures and Footer
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PAYMENT METHOD: BANK TRANSFER", 15, tablesEndY + 10);
    doc.text(`ACCOUNT NO: ****${Math.floor(1000 + Math.random() * 9000)}`, 15, tablesEndY + 15);
    doc.text(`DATE OF DISBURSEMENT: ${new Date().toLocaleDateString()}`, 15, tablesEndY + 20);

    doc.line(140, 260, 190, 260); // Signature Line
    doc.text("DIGITALLY SIGNED BY", 140, 265);
    doc.setFont("helvetica", "bold");
    doc.text("RUDRATIC HR MANAGER", 140, 270);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("This is an electronically generated document. No physical signature is required.", 15, 285);
    doc.text(`SYSTEM AUTH ID: ${user.name.substring(0, 3).toUpperCase()}-${Date.now()}`, 15, 290);

    // Save PDF to Buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return uploadPayslip(
        userId,
        month,
        year,
        amount,
        pdfBuffer,
        `Payslip_${user.name.replace(/\s+/g, '_')}_${month}_${year}.pdf`,
        user.companyId
    );
};

// Ensure base directory exists
if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

export const uploadPayslip = async (
    userId: string,
    month: string,
    year: number,
    amount: number,
    fileBuffer: Buffer,
    filename: string,
    companyId?: string
) => {
    const safeFilename = `${userId}_${Date.now()}.pdf`;
    const storagePath = `${year}/${month}/${safeFilename}`;
    let fileUrl = '';

    // 1. Try Supabase Upload first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        try {
            const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(storagePath, fileBuffer, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (error) throw error;
            fileUrl = `supabase://${storagePath}`; // Use a prefix to distinguish
        } catch (e: any) {
            console.error("Supabase Upload Failed, falling back to local:", e.message);
        }
    }

    // 2. Local Fallback (or if Supabase failed)
    if (!fileUrl) {
        const yearDir = path.join(UPLOAD_ROOT, year.toString());
        const monthDir = path.join(yearDir, month);

        if (!fs.existsSync(monthDir)) {
            fs.mkdirSync(monthDir, { recursive: true });
        }

        const filePath = path.join(monthDir, safeFilename);
        fs.writeFileSync(filePath, fileBuffer);
        fileUrl = path.relative(process.cwd(), filePath);
    }

    // 3. Database Entry
    const existing = await prisma.payslip.findFirst({
        where: { userId, month, year, companyId }
    });

    if (existing) {
        // Clean up old file if local
        if (existing.fileUrl && !existing.fileUrl.startsWith('supabase://')) {
            try {
                const oldPath = path.join(process.cwd(), existing.fileUrl);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            } catch (e) { }
        }

        return prisma.payslip.update({
            where: { id: existing.id },
            data: {
                fileUrl,
                basicSalary: amount,
                netSalary: amount,
                grossSalary: amount,
                totalDeductions: 0,
                status: PayrollStatus.DRAFT,
                updatedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: { select: { name: true } },
                        designation: { select: { name: true } }
                    }
                }
            }
        });
    }

    // Invalidate caches
    cache.del(`my_payslips_${userId}`);
    cache.del(`dashboard_data_${userId}`);

    return prisma.payslip.create({
        data: {
            userId,
            month,
            year,
            companyId,
            basicSalary: amount,
            netSalary: amount,
            grossSalary: amount,
            totalDeductions: 0,
            fileUrl,
            status: PayrollStatus.DRAFT
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                    designation: true
                }
            }
        }
    });
};

export const getPayslipFile = async (payslipId: string, requesterId: string, roleName: string) => {
    const payslip = await prisma.payslip.findUnique({
        where: { id: payslipId },
        include: { user: true }
    });

    if (!payslip) throw new Error("Payslip not found");

    const elevatedRoles = ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'HR_ADMIN', 'HR'];
    if (!elevatedRoles.includes(roleName.toUpperCase()) && payslip.userId !== requesterId) {
        throw new Error("Unauthorized access to this payslip. Your role does not have download clearance.");
    }

    let url = '';
    let absolutePath = '';

    if (payslip.fileUrl && payslip.fileUrl.startsWith('supabase://')) {
        const storagePath = payslip.fileUrl.replace('supabase://', '');
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(storagePath, 60); // 60 seconds expiry

        if (error) throw new Error(`Supabase Error: ${error.message}`);
        url = data.signedUrl;
    } else if (payslip.fileUrl) {
        absolutePath = path.resolve(process.cwd(), payslip.fileUrl);
        if (!fs.existsSync(absolutePath)) {
            throw new Error("Payslip file not found on server");
        }
    } else {
        throw new Error("Payslip file URL is missing");
    }

    if (payslip.userId === requesterId && payslip.status === PayrollStatus.RELEASED) {
        // No separate DOWNLOADED status in schema, keep as RELEASED
        await prisma.payslip.update({
            where: { id: payslipId },
            data: { status: PayrollStatus.RELEASED }
        });
    }

    return {
        path: absolutePath,
        url,
        filename: `${payslip.month}_${payslip.year}_Payslip.pdf`
    };
};

export const releasePayslip = async (id: string, companyId: string) => {
    const slip = await prisma.payslip.update({
        where: { id, companyId },
        data: { status: PayrollStatus.RELEASED },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: { select: { name: true } },
                    designation: { select: { name: true } }
                }
            }
        }
    });

    // Invalidate caches
    cache.del(`my_payslips_${slip.userId}_${companyId}`);
    cache.del(`dashboard_data_${slip.userId}`);

    // Notify user
    try {
        await createNotification({
            userId: slip.userId,
            companyId,
            title: "New Payslip Released",
            message: `Your payslip for ${slip.month} ${slip.year} is now available for download.`,
            type: NotificationType.SUCCESS
        });
    } catch (e) {
        console.error("Failed to notify user about payslip release", e);
    }

    return slip;
};

export const getMyPayslips = async (userId: string, companyId: string) => {
    const cacheKey = `my_payslips_${userId}_${companyId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached as any;

    const slips = await prisma.payslip.findMany({
        where: {
            userId,
            companyId,
            status: PayrollStatus.RELEASED
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: { select: { name: true } },
                    designation: { select: { name: true } }
                }
            }
        },
        orderBy: [
            { year: 'desc' },
            { month: 'desc' }
        ]
    });

    const mappedSlips = slips.map(s => ({
        ...s,
        amount: Number(s.netSalary)
    }));

    cache.set(cacheKey, mappedSlips, 300); // 5 mins
    return mappedSlips;
};

export const getAllPayslips = async (companyId: string, year?: number, month?: string, status?: string, userId?: string) => {
    const cacheKey = `all_payslips_${companyId}_${year}_${month}_${status}_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached as any;

    const whereClause: any = { companyId };
    if (year) whereClause.year = year;
    if (month) whereClause.month = month;
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = userId;

    const slips = await prisma.payslip.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: { select: { name: true } },
                    designation: { select: { name: true } }
                }
            }
        },
        orderBy: [
            { year: 'desc' },
            { month: 'desc' }
        ]
    });

    const mappedSlips = slips.map(s => ({
        ...s,
        amount: Number(s.netSalary)
    }));

    cache.set(cacheKey, mappedSlips, 60); // 1 min for admin view
    return mappedSlips;
};

export const bulkUpdateStatus = async (ids: string[], companyId: string, status: PayrollStatus) => {
    const results = await prisma.payslip.updateMany({
        where: { id: { in: ids }, companyId },
        data: { status }
    });

    // Invalidate caches for all affected users
    const usersToInvalidate = await prisma.payslip.findMany({
        where: { id: { in: ids }, companyId },
        select: { userId: true }
    });

    usersToInvalidate.forEach(u => {
        cache.del(`my_payslips_${u.userId}_${companyId}`);
        cache.del(`dashboard_data_${u.userId}`);
    });

    // Create notifications for all updated payslips
    const updatedPayslips = await prisma.payslip.findMany({
        where: { id: { in: ids }, status: PayrollStatus.RELEASED, companyId },
        select: { userId: true, month: true, year: true }
    });

    for (const slip of updatedPayslips) {
        try {
            await createNotification({
                userId: slip.userId,
                companyId,
                title: "New Payslip Released",
                message: `Your payslip for ${slip.month} ${slip.year} is now available for download.`,
                type: NotificationType.SUCCESS
            });
        } catch (e) {
            console.error("Failed to notify user about payslip release", e);
        }
    }

    return results;
};

export const deletePayslip = async (id: string, companyId: string) => {
    return prisma.payslip.deleteMany({
        where: { id, companyId }
    });
};

export const updatePayslip = async (id: string, companyId: string, data: { month?: string, year?: number, amount?: number, status?: PayrollStatus }) => {
    const updateData: any = { ...data };

    if (data.amount !== undefined) {
        updateData.basicSalary = data.amount;
        updateData.netSalary = data.amount;
        updateData.grossSalary = data.amount;
        delete updateData.amount;
    }

    return prisma.payslip.updateMany({
        where: { id, companyId },
        data: updateData
    });
};
