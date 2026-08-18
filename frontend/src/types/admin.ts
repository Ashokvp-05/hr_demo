export interface PendingUser {
    id: string;
    email: string;
    name: string;
    createdAt: string;
    role?: string | { name: string };
    status?: string;
    department?: string;
    designation?: string;
}

export interface PendingLeave {
    id: string;
    status: string;
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
    user?: { name: string };
}

export interface PendingPayslip {
    id: string;
    month: string;
    year: number;
    amount: string | number;
    user?: { name: string };
}
