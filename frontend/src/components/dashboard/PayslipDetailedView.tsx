import React, { useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Download, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface PayslipData {
    payNumber: string;
    month: string;
    year: number;
    basicSalary: number | string;
    hra: number | string;
    da: number | string;
    bonus: number | string;
    otherAllowances: number | string;
    grossSalary: number | string;
    pfDeduction: number | string;
    taxDeduction: number | string;
    leaveDeduction: number | string;
    totalDeductions: number | string;
    netSalary: number | string;
    status: string;
    generatedAt: string;
    user: {
        name: string;
        email: string;
        department: string | { name: string };
        designation: string | { name: string };
        employeeId?: string;
        joiningDate?: string;
    };
}

export function PayslipDetailedView({ data }: { data: PayslipData }) {
    const [downloading, setDownloading] = React.useState(false);

    if (!data) return null;

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(amount));
    };

    const handleDownload = async () => {
        const element = document.getElementById('payslip-content');
        if (!element) return;

        setDownloading(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Payslip-${data.month}-${data.year}.pdf`);
            toast.success("Payslip exported.");
        } catch (error) {
            toast.error("Export failed.");
        } finally {
            setDownloading(false);
        }
    };

    const summaryItems = [
        { label: "Employee Name", value: data.user?.name || "Staff" },
        { label: "Designation", value: typeof data.user?.designation === 'object' ? (data.user.designation as any).name : data.user?.designation },
        { label: "Date of Joining", value: data.user?.joiningDate ? new Date(data.user.joiningDate).toLocaleDateString() : '30/06/2020' },
        { label: "Pay Period", value: `${data.month} ${data.year}` },
        { label: "Pay Date", value: new Date(data.generatedAt).toLocaleDateString() },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-10 px-4">
            <div className="flex justify-end gap-3" data-html2canvas-ignore="true">
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="h-9 rounded-lg font-bold border-slate-300 hover:bg-slate-50 transition-colors">
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />} Print
                </Button>
                <Button size="sm" onClick={handleDownload} disabled={downloading} className="h-9 rounded-lg font-bold bg-slate-900 hover:bg-black text-white px-6 transition-all shadow-md">
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
            </div>

            <Card id="payslip-content" className="border-none bg-white p-0 rounded-none shadow-none text-slate-800 font-sans selection:bg-indigo-100">
                {/* 1. Top Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">Rudratic HR</h1>
                        <p className="text-sm font-medium text-slate-500">Noida, Uttar Pradesh, 201309</p>
                    </div>
                    <div className="w-20 h-20 bg-white flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" alt="Company Logo" className="w-full h-full object-contain" />
                    </div>
                </div>

                {/* 2. Month Heading */}
                <div className="border-t border-b border-slate-200 py-3 mb-6">
                    <h2 className="text-center text-sm font-bold uppercase tracking-wider text-slate-900">
                        Payslip for the month of {data.month} {data.year}
                    </h2>
                </div>

                {/* 3. Employee Summary Box */}
                <div className="border border-slate-300 grid grid-cols-1 md:grid-cols-2">
                    <div className="p-6 border-r border-slate-300">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-100">Employee Pay Summary</p>
                        <div className="space-y-2.5">
                            {summaryItems.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-[140px_1fr] text-[12px] leading-relaxed">
                                    <span className="text-slate-600 font-medium">{item.label}</span>
                                    <div className="flex gap-2">
                                        <span className="text-slate-400 font-medium">:</span>
                                        <span className="font-bold text-slate-900">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50/10 flex flex-col justify-center items-center">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center">Employee Net Pay</p>
                        <h3 className="text-5xl font-bold text-slate-900 tracking-tight mb-2">{formatCurrency(data.netSalary)}</h3>
                        <p className="text-[10px] font-bold text-slate-400 py-1.5 px-3 border border-slate-200 rounded-full">
                            Paid Days : 30 | LOP Days : 0
                        </p>
                    </div>
                </div>

                {/* 4. Financial Matrix */}
                <div className="mt-8 border-t border-l border-slate-300 text-[12px]">
                    <div className="grid grid-cols-2">
                        {/* Earnings Side */}
                        <div className="border-r border-slate-300 flex flex-col">
                            <div className="grid grid-cols-[1fr_80px_80px] bg-slate-50 border-b border-slate-300">
                                <span className="px-4 py-2 font-bold uppercase text-[10px] tracking-wider text-slate-500">Earnings</span>
                                <span className="px-4 py-2 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-right">Amount</span>
                                <span className="px-4 py-2 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-right">YTD</span>
                            </div>
                            <div className="flex-1 divide-y divide-slate-100">
                                {[
                                    { label: "Basic", amount: data.basicSalary },
                                    { label: "House Rent Allowance", amount: data.hra },
                                    { label: "Bonus", amount: data.bonus },
                                    { label: "Other Allowances", amount: data.otherAllowances }
                                ].map((row, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr_80px_80px] px-4 py-3 border-b border-slate-200">
                                        <span className="font-medium text-slate-700">{row.label}</span>
                                        <span className="text-right font-bold text-slate-900">{formatCurrency(row.amount)}</span>
                                        <span className="text-right font-medium text-slate-400">{formatCurrency(row.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-[1fr_80px_80px] px-4 py-2.5 bg-slate-50/50 border-t border-slate-200 font-bold">
                                <span className="uppercase text-[10px] tracking-widest text-slate-600">Gross Earnings</span>
                                <span className="text-right text-slate-900">{formatCurrency(data.grossSalary)}</span>
                                <span className="text-right text-slate-400">{formatCurrency(data.grossSalary)}</span>
                            </div>
                        </div>

                        {/* Deductions Side */}
                        <div className="border-r border-slate-300 flex flex-col">
                            <div className="grid grid-cols-[1fr_80px_80px] bg-slate-50 border-b border-slate-300">
                                <span className="px-4 py-2 font-bold uppercase text-[10px] tracking-wider text-slate-500">Deductions</span>
                                <span className="px-4 py-2 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-right">Amount</span>
                                <span className="px-4 py-2 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-right">YTD</span>
                            </div>
                            <div className="flex-1 divide-y divide-slate-100">
                                {[
                                    { label: "Provident Fund", amount: data.pfDeduction },
                                    { label: "Income Tax", amount: data.taxDeduction },
                                    { label: "LOP Deduction", amount: data.leaveDeduction }
                                ].map((row, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr_80px_80px] px-4 py-3 border-b border-slate-200">
                                        <span className="font-medium text-slate-700">{row.label}</span>
                                        <span className="text-right font-bold text-slate-900">{formatCurrency(row.amount)}</span>
                                        <span className="text-right font-medium text-slate-400">{formatCurrency(row.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-[1fr_80px_80px] px-4 py-2.5 bg-slate-50/50 border-t border-slate-200 font-bold">
                                <span className="uppercase text-[10px] tracking-widest text-slate-600">Total Deductions</span>
                                <span className="text-right text-slate-900">{formatCurrency(data.totalDeductions)}</span>
                                <span className="text-right text-slate-400">{formatCurrency(data.totalDeductions)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Final Net Pay Row */}
                    <div className="flex border-b border-r border-slate-300 bg-white">
                        <div className="flex-1 flex justify-end items-center pr-20 py-4">
                            <span className="font-bold text-[14px] uppercase tracking-[0.1em] text-slate-900">Total Net Payable</span>
                        </div>
                        <div className="w-[160px] flex justify-center items-center py-4 bg-slate-50 border-l border-slate-200">
                            <span className="text-lg font-bold text-slate-900">{formatCurrency(data.netSalary)}</span>
                        </div>
                    </div>
                </div>


                {/* 5. Amount in Words */}
                <div className="mt-8 px-4 text-center space-y-2">
                    <p className="text-[13px] font-bold text-slate-900">
                        Total Net Payable: {formatCurrency(data.netSalary).replace('₹', 'Indian Rupee ')} Only
                    </p>
                    <p className="text-[10px] font-medium text-slate-400">
                        **Total Net Payable = Gross Earnings - Total Deductions
                    </p>
                </div>

                {/* 6. Legal Footer */}
                <div className="mt-12 text-center border-t border-slate-100 pt-6 opacity-30">
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-300">
                        Digitally Verified Document • Rudratic HR Ecosystem
                    </p>
                </div>
            </Card>
        </div>
    );
}
