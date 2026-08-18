import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import * as leaveService from '../services/leave.service';
import { LeaveStatus } from '@prisma/client';
import { broadcast, triggerDashboardUpdate } from '../services/websocket.service';
import { JWT_SECRET } from '../config/env';

const router = Router();

// Generate a signed token for email actions
export const generateLeaveActionToken = (requestId: string, adminId: string, companyId: string, action: 'approve' | 'reject'): string => {
    return jwt.sign(
        { requestId, adminId, companyId, action },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Build the action URL
export const buildLeaveActionUrl = (token: string): string => {
    const baseUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL?.replace(':3000', ':4000') || 'http://localhost:4000';
    return `${baseUrl}/api/leave-email-action/execute?token=${token}`;
};

// HTML response page
const renderResultPage = (success: boolean, action: string, employeeName: string, message: string) => {
    const color = action === 'approve' ? '#10b981' : '#ef4444';
    const icon = action === 'approve' ? '✅' : '❌';
    const title = action === 'approve' ? 'Leave Approved' : 'Leave Rejected';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Rudratic HR</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .card { background: white; border-radius: 24px; padding: 48px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; letter-spacing: -0.02em; }
        .status { display: inline-block; background: ${color}15; color: ${color}; padding: 8px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; }
        .message { color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
        .employee { color: #1e293b; font-weight: 700; }
        .btn { display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; }
        .btn:hover { background: #4338ca; }
        .footer { margin-top: 32px; color: #cbd5e1; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <div class="status">${success ? 'Action Completed' : 'Action Failed'}</div>
        <p class="message">${message}</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin?tab=leave" class="btn">Open Dashboard</a>
        <p class="footer">Rudratic Personnel Core</p>
    </div>
</body>
</html>`;
};

// GET /api/leave-email-action/execute?token=...
router.get('/execute', async (req: Request, res: Response) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).send(renderResultPage(false, 'unknown', '', 'Invalid or missing action token.'));
        }

        let payload: any;
        try {
            payload = jwt.verify(token, JWT_SECRET);
        } catch (err: any) {
            return res.status(400).send(renderResultPage(false, 'unknown', '', 'This link has expired or is invalid. Please use the dashboard to take action.'));
        }

        const { requestId, adminId, companyId, action } = payload;

        // Fetch the leave request to check status and get employee name
        const leaveRequest = await (prisma as any).leaveRequest.findFirst({
            where: { id: requestId, companyId },
            include: { user: { select: { name: true } } }
        });

        if (!leaveRequest) {
            return res.status(404).send(renderResultPage(false, action, '', 'Leave request not found.'));
        }

        const employeeName = leaveRequest.user?.name || 'Employee';

        if (leaveRequest.status !== 'PENDING') {
            return res.send(renderResultPage(false, action, employeeName, 
                `This leave request from <span class="employee">${employeeName}</span> has already been <strong>${leaveRequest.status.toLowerCase()}</strong>. No further action is needed.`));
        }

        // Execute the action
        const status = action === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;
        const reason = action === 'reject' ? 'Rejected via email' : undefined;
        
        const updatedRequest = await leaveService.updateStatus(requestId, status, adminId, companyId, reason);
        
        broadcast('LEAVE_UPDATED', updatedRequest);
        triggerDashboardUpdate();

        const actionVerb = action === 'approve' ? 'approved' : 'rejected';
        return res.send(renderResultPage(true, action, employeeName,
            `The leave request from <span class="employee">${employeeName}</span> has been successfully <strong>${actionVerb}</strong>. The employee will be notified.`));

    } catch (error: any) {
        console.error('Leave email action error:', error);
        return res.status(500).send(renderResultPage(false, 'unknown', '', `Something went wrong: ${error.message}`));
    }
});

export default router;
