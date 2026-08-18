export interface LeaveRequest {
    id: string;
    type: string;
    startDate: string | Date;
    endDate: string | Date;
    reason?: string;
    status: string;
    user: {
        id: string;
        name: string;
        email?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface TeamMemberStatus {
    id: string;
    name: string;
    status: string;
    location?: string;
    department?: string;
    clockIn: string | Date;
}
