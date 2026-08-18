"use client"

import { useState } from "react"
import { CalendarIcon, Download, FileSpreadsheet, FileText, Filter } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function GenerateReportPage() {
    const { toast } = useToast()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [loading, setLoading] = useState(false)
    const [reportType, setReportType] = useState("attendance")
    const [formatType, setFormatType] = useState("excel")

    const handleGenerate = async () => {
        setLoading(true)
        // Mock generation delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        setLoading(false)
        toast({
            title: "Report Generated",
            description: `Your ${reportType} report has been generated in ${formatType} format.`,
        })
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Generate Reports</h2>
                    <p className="text-muted-foreground mt-1">Export detailed system data for analysis and compliance.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2 border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-indigo-500" />
                            Report Configuration
                        </CardTitle>
                        <CardDescription>Select the data type and time range for your report.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Report Type</Label>
                                <Select value={reportType} onValueChange={setReportType}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select report type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="attendance">Daily Attendance Report</SelectItem>
                                        <SelectItem value="leaves">Leave & Absence Report</SelectItem>
                                        <SelectItem value="payroll">Payroll Data Export</SelectItem>
                                        <SelectItem value="users">User Directory & Status</SelectItem>
                                        <SelectItem value="audit">System Audit Logs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Select Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="grid gap-2">
                                <Label>Export Format</Label>
                                <RadioGroup defaultValue="excel" value={formatType} onValueChange={setFormatType} className="grid grid-cols-3 gap-4">
                                    <div>
                                        <RadioGroupItem value="excel" id="excel" className="peer sr-only" />
                                        <Label
                                            htmlFor="excel"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:text-indigo-600 cursor-pointer"
                                        >
                                            <FileSpreadsheet className="mb-2 h-6 w-6" />
                                            Excel
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="csv" id="csv" className="peer sr-only" />
                                        <Label
                                            htmlFor="csv"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:text-indigo-600 cursor-pointer"
                                        >
                                            <FileText className="mb-2 h-6 w-6" />
                                            CSV
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                                        <Label
                                            htmlFor="pdf"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:text-indigo-600 cursor-pointer"
                                        >
                                            <Download className="mb-2 h-6 w-6" />
                                            PDF
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end bg-slate-50 dark:bg-slate-900/50 p-6 rounded-b-xl">
                        <Button
                            size="lg"
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[200px]"
                        >
                            {loading ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Report
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
