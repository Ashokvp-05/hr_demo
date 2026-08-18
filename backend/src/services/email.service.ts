import * as nodemailer from 'nodemailer';
import prisma from '../config/db';

export const sendEmail = async (to: string, subject: string, html: string, companyId?: string, fromName: string = 'Swot HR Department') => {
    try {
        let smtpConfig: any = null;
        
        if (companyId) {
            const config = await prisma.systemConfig.findUnique({
                where: { key_companyId: { key: 'SMTP_SETTINGS', companyId } }
            });
            if (config) smtpConfig = config.value;
        }
        
        if (!smtpConfig) {
            const fallbackConfig = await prisma.systemConfig.findFirst({
                where: { key: 'SMTP_SETTINGS' }
            });
            if (fallbackConfig) {
                smtpConfig = fallbackConfig.value;
            } else if (process.env.SMTP_SERVER) {
                smtpConfig = {
                    server: process.env.SMTP_SERVER,
                    port: Number(process.env.SMTP_PORT) || 587,
                    username: process.env.SMTP_USERNAME,
                    password: process.env.SMTP_PASSWORD,
                    senderEmail: process.env.SENDER_EMAIL || 'noreply@rudratic.com',
                    enableTls: process.env.ENABLE_TLS === 'true'
                };
            }
        }

        if (!smtpConfig || !smtpConfig.server) {
            console.log(`[MOCK EMAIL] TO: ${to} | SUBJECT: ${subject}`);
            console.log(`[CONTENT]: ${html}`);
            return { id: 'mock-email-id' };
        }

        const transporter = nodemailer.createTransport({
            host: smtpConfig.server,
            port: Number(smtpConfig.port),
            secure: Number(smtpConfig.port) === 465,
            auth: smtpConfig.username ? {
                user: smtpConfig.username,
                pass: smtpConfig.password
            } : undefined
        });

        const info = await transporter.sendMail({
            from: `"${fromName}" <${smtpConfig.senderEmail || 'noreply@rudratic.com'}>`,
            to,
            subject,
            html,
        });
        
        return info;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    const subject = `Welcome to the Organization, ${name}`;
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
    const html = `
        <div style="font-family: 'Inter', sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; background: #ffffff;">
            <div style="margin-bottom: 32px;">
                <h2 style="color: #4f46e5; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; margin: 0; italic">Personnel Initialize <span style="color: #1e293b;">Complete</span></h2>
                <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 8px;">Authorized Access Protocol Activated</p>
            </div>
            
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Welcome to the team, <strong>${name}</strong>. Your identity node has been successfully integrated into the HRMS registry. You can now access your high-fidelity personnel hub to complete your onboarding manifest.</p>
            
            <div style="background: #f8fafc; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
                <h4 style="color: #1e293b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0;">Onboarding Manifest Shards:</h4>
                <ul style="color: #475569; font-size: 13px; margin: 0; padding-left: 20px; line-height: 2;">
                    <li>Complete Profile Identity Matrix</li>
                    <li>Upload Required Document Shards (ID, Address)</li>
                    <li>Sign Digital Policy Artifacts</li>
                    <li>Initialize Training Modules</li>
                </ul>
            </div>

            <div style="text-align: center; margin-bottom: 32px;">
                <a href="${loginUrl}" style="background: #4f46e5; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block; box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.3);">Access Personnel Hub</a>
            </div>

            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0; line-height: 1.6;">If you have any clinical issues with your access handshake, please contact your department manager immediately.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
            <p style="font-size: 10px; color: #cbd5e1; text-align: center; text-transform: uppercase; letter-spacing: 0.3em; margin: 0;">Clinical HRMS • Secure Personnel Shard</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendClockOutReminder = async (email: string, name: string) => {
    const subject = 'Reminder: Clock Out';
    const html = `
        <p>Hi ${name},</p>
        <p>It's past 7 PM. If you have finished your work, please remember to clock out.</p>
    `;
    return sendEmail(email, subject, html);
};

export const sendWeeklyReport = async (email: string, stats: any) => {
    const subject = `Rudratic Weekly Report - ${new Date().toLocaleDateString()}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="color: #2563eb;">Rudratic Workforce Summary</h1>
            <p>Here is the automated summary for the past 7 days:</p>
            <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%;">
                <tr style="background: #f8fafc;">
                    <td>Total Active Employees</td>
                    <td><strong>${stats.totalUsers}</strong></td>
                </tr>
                <tr>
                    <td>Total Hours Logged</td>
                    <td><strong>${stats.totalHours} hrs</strong></td>
                </tr>
                <tr style="background: #f8fafc;">
                    <td>Leave Requests Pending</td>
                    <td><strong>${stats.pendingLeaves}</strong></td>
                </tr>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
                This satisfies task 5.7 in your Project Tracker.
            </p>
        </div>
    `;
    return sendEmail(email, subject, html);
};
export const sendPasswordResetEmail = async (email: string, token: string) => {
    const subject = 'Password Reset Request - Rudratic HR';
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">Password Reset Request</h2>
            <p>You requested a password reset for your Rudratic HR account.</p>
            <p>Please click the link below to set a new password. This link will expire in 1 hour.</p>
            <div style="margin: 20px 0;">
                <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">If you did not request this, please ignore this email.</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendMonthlyReport = async (email: string, stats: any) => {
    const subject = `Rudratic Monthly Overall Report - ${stats.month} ${stats.year}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; font-size: 24px; margin-bottom: 24px;">Monthly Corporate Summary</h1>
            <p style="color: #475569; font-size: 15px; margin-bottom: 24px;">Executive report for <strong>${stats.month} ${stats.year}</strong>. This satisfies the end-of-month analytical overview.</p>
            
            <table border="1" cellpadding="12" style="border-collapse: collapse; width: 100%; border-color: #e2e8f0; margin-bottom: 32px;">
                <tr style="background: #f8fafc;">
                    <td style="color: #334155; font-weight: 600;">Total Active Workforce</td>
                    <td style="color: #0f172a; font-weight: 800; font-size: 18px; text-align: right;">${stats.totalUsers}</td>
                </tr>
                <tr>
                    <td style="color: #334155; font-weight: 600;">Total Labor Hours Logged</td>
                    <td style="color: #0f172a; font-weight: 800; font-size: 18px; text-align: right;">${stats.totalHours} hrs</td>
                </tr>
                <tr style="background: #f8fafc;">
                    <td style="color: #334155; font-weight: 600;">Approved Leaves</td>
                    <td style="color: #0f172a; font-weight: 800; font-size: 18px; text-align: right;">${stats.approvedLeaves}</td>
                </tr>
                <tr>
                    <td style="color: #334155; font-weight: 600;">Payslips Generated</td>
                    <td style="color: #0f172a; font-weight: 800; font-size: 18px; text-align: right;">${stats.payslips}</td>
                </tr>
            </table>

            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?tab=reports" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Access Detailed Analytics</a>
            </div>

            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
            <p style="font-size: 10px; color: #cbd5e1; text-align: center; text-transform: uppercase; letter-spacing: 0.2em; margin: 0;">Rudratic Personnel Core • Automated Reporting Module</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendVerificationEmail = async (email: string, token: string) => {
    const subject = 'Verify your email - Rudratic HR';
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; font-size: 20px;">Verify Your Identity</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Welcome to Rudratic! Please verify your email address to complete your organization's registration.</p>
            <div style="margin: 32px 0;">
                <a href="${verifyUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Verify Email</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">If you did not create an account, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.2em;">Rudratic Personnel Core • SaaS Platform</p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendDailyAttendanceReport = async (email: string, stats: any) => {
    const subject = `Daily Attendance Analysis - ${stats.date}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="color: #2563eb;">Daily Attendance Analysis</h1>
            <p>End-of-day summary for ${stats.date}:</p>
            <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                <tr style="background: #f8fafc;">
                    <td>Total Employees Present</td>
                    <td><strong>${stats.totalEntries}</strong></td>
                </tr>
                <tr>
                    <td>Late Clock-ins (> 9:30 AM)</td>
                    <td style="color: #dc2626;"><strong>${stats.lateCount}</strong></td>
                </tr>
                <tr style="background: #f8fafc;">
                    <td>Missing Clock-outs (Still Active)</td>
                    <td style="color: #ea580c;"><strong>${stats.ghostCount}</strong></td>
                </tr>
                <tr>
                    <td>Total Worked Hours</td>
                    <td><strong>${stats.totalHours} hrs</strong></td>
                </tr>
            </table>

            <h3>Systemic Log Detail</h3>
            <ul style="font-size: 13px; color: #334155;">
                ${stats.summaries.map((s: string) => `<li>${s}</li>`).join('')}
            </ul>

            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">
                This satisfies the requested analytical requirement for temporal monitoring.
            </p>
        </div>
    `;
    return sendEmail(email, subject, html);
};

export const sendLeaveRequestNotification = async (
    email: string, 
    employeeName: string, 
    leaveType: string, 
    startDate: string, 
    endDate: string,
    approveUrl?: string,
    rejectUrl?: string,
    companyId?: string,
    fromName?: string
) => {
    const subject = `New Leave Request - ${employeeName}`;
    
    const actionButtons = (approveUrl && rejectUrl) ? `
            <div style="margin: 32px 0; display: flex; flex-direction: column; align-items: center; gap: 12px;">
                <a href="${approveUrl}" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: block; width: 200px; text-align: center;">✅ Approve</a>
                <a href="${rejectUrl}" style="background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: block; width: 200px; text-align: center;">❌ Reject</a>
            </div>
            <div style="margin: 16px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?tab=leave" style="color: #c084fc; font-size: 13px; font-weight: 600; text-decoration: underline;">Or view in Dashboard</a>
            </div>` : `
            <div style="margin: 32px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin?tab=leave" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: block;">View Request in Dashboard</a>
            </div>`;

    const html = `
        <div style="font-family: 'Inter', sans-serif; background-color: #0f172a; padding: 32px 20px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b; border-radius: 12px; color: #f8fafc;">
            <h2 style="color: #c084fc; text-transform: uppercase; letter-spacing: 0.1em; font-size: 20px; margin-top: 0;">New Leave Request</h2>
            <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6;"><strong>${employeeName}</strong> has submitted a new leave request.</p>
            <table cellpadding="12" style="border-collapse: collapse; width: 100%; margin-bottom: 24px; border: 1px solid #334155; text-align: left;">
                <tr style="border-bottom: 1px solid #334155;">
                    <td style="width: 30%; border-right: 1px solid #334155; font-weight: bold; color: #f8fafc;">Leave Type</td>
                    <td style="color: #e2e8f0;">${leaveType}</td>
                </tr>
                <tr style="border-bottom: 1px solid #334155;">
                    <td style="border-right: 1px solid #334155; font-weight: bold; color: #f8fafc;">Start Date</td>
                    <td style="color: #e2e8f0;">${startDate}</td>
                </tr>
                <tr>
                    <td style="border-right: 1px solid #334155; font-weight: bold; color: #f8fafc;">End Date</td>
                    <td style="color: #e2e8f0;">${endDate}</td>
                </tr>
            </table>
            ${actionButtons}
            <div style="margin-top: 40px; color: #94a3b8; font-size: 12px;">
                This is an automated notification for Super Admins. Action links expire in 7 days.
                <hr style="border: 0; border-top: 1px solid #334155; margin: 16px 0;" />
                <span style="color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; font-size: 10px;">Rudratic Personnel Core</span>
            </div>
        </div>
    `;
    return sendEmail(email, subject, html, companyId, fromName);
};

export const sendLeaveSubmissionConfirmation = async (email: string, name: string, leaveType: string, startDate: string, endDate: string, companyId?: string) => {
    const subject = `Leave Request Submitted - ${leaveType}`;
    const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; font-size: 20px;">Request Submitted</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your leave request has been successfully submitted and is pending approval.</p>
            <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
                <tr style="background: #f8fafc;">
                    <td style="width: 30%;"><strong>Leave Type</strong></td>
                    <td>${leaveType}</td>
                </tr>
                <tr>
                    <td><strong>Start Date</strong></td>
                    <td>${startDate}</td>
                </tr>
                <tr style="background: #f8fafc;">
                    <td><strong>End Date</strong></td>
                    <td>${endDate}</td>
                </tr>
            </table>
            <p style="font-size: 12px; color: #94a3b8;">You will receive another email once your manager or admin has reviewed your request.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.2em;">Rudratic Personnel Core</p>
        </div>
    `;
    return sendEmail(email, subject, html, companyId);
};

export const sendLeaveStatusUpdate = async (email: string, name: string, status: string, leaveType: string, reason?: string, companyId?: string) => {
    const subject = `Leave Request ${status} - ${leaveType}`;
    const statusColor = status.toLowerCase() === 'approved' ? '#10b981' : '#ef4444';
    const html = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: ${statusColor}; text-transform: uppercase; letter-spacing: 0.1em; font-size: 20px;">Request ${status}</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your ${leaveType} request has been <strong>${status.toLowerCase()}</strong>.</p>
            ${reason ? `<p style="color: #475569; font-size: 14px; background: #f8fafc; padding: 12px; border-radius: 6px;"><strong>Note:</strong> ${reason}</p>` : ''}
            <div style="margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employee?tab=leave" style="background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">View in Dashboard</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.2em;">Rudratic Personnel Core</p>
        </div>
    `;
    return sendEmail(email, subject, html, companyId);
};

export const sendOtpEmail = async (to: string, otp: string) => {
    const subject = "Your Demo Login OTP";
    const html = `<b>Your One-Time Password for the HR Automation Demo is:</b> <h2 style="color: #7c3aed;">${otp}</h2><p>It will expire in 5 minutes.</p>`;
    
    // Create direct transporter using default rudratic credentials if not in db
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || process.env.SMTP_SERVER || "mail.rudratic.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER || process.env.SMTP_USERNAME || "alert@rudratic.com",
                pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "h3N%$Ynh3fQh",
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3'
            },
            connectionTimeout: 10000
        });

        const info = await transporter.sendMail({
            from: `"HR Automation Demo" <${process.env.SMTP_USER || process.env.SMTP_USERNAME || "alert@rudratic.com"}>`,
            to,
            subject,
            text: `Your One-Time Password for the HR Automation Demo is: ${otp}. It will expire in 5 minutes.`,
            html,
        });
        console.log(`[EMAIL SENT] OTP email sent to ${to}: %s`, info.messageId);
        return true;
    } catch (err: any) {
        console.error(`[EMAIL ERROR] Failed to send OTP email to ${to}:`, err.message);
        // Fallback to sendEmail service if custom transport failed
        try {
            await sendEmail(to, subject, html, undefined, "HR Automation Demo");
            return true;
        } catch (e) {
            return false;
        }
    }
};

export const sendAccessApprovalEmail = async (to: string) => {
    const subject = "Your HR Automation Demo Access is Approved!";
    const message = "Good news! Your request for demo access has been approved by an administrator. You can now log in and explore the platform.";
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || process.env.SMTP_SERVER || "mail.rudratic.com",
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER || process.env.SMTP_USERNAME || "alert@rudratic.com",
                pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "h3N%$Ynh3fQh",
            },
            tls: {
                rejectUnauthorized: false,
                ciphers: 'SSLv3'
            },
            connectionTimeout: 10000
        });

        const info = await transporter.sendMail({
            from: `"HR Automation Demo" <${process.env.SMTP_USER || process.env.SMTP_USERNAME || "alert@rudratic.com"}>`,
            to,
            subject,
            text: message,
            html: `<b>${message}</b>`,
        });
        console.log(`[EMAIL SENT] Approval email sent to ${to}: %s`, info.messageId);
        return true;
    } catch (err: any) {
        console.error(`[EMAIL ERROR] Failed to send approval email to ${to}:`, err.message);
        return false;
    }
};
