import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';
import * as nodemailer from 'nodemailer';

const router = express.Router();

router.get('/email', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        if (!user || !user.companyId) return res.status(400).json({ error: 'Company ID required' });
        const companyId = user.companyId;

        const config = await prisma.systemConfig.findUnique({
            where: { key_companyId: { key: 'SMTP_SETTINGS', companyId } }
        });

        if (!config || !config.value) {
            return res.json({});
        }

        const value = config.value as any;
        
        // Don't send password back to the client for security
        res.json({
            server: value.server,
            port: value.port,
            username: value.username,
            senderEmail: value.senderEmail,
            enableTls: value.enableTls
        });
    } catch (error) {
        console.error('Error fetching email settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/email', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        if (!user || !user.companyId) return res.status(400).json({ error: 'Company ID required' });
        const companyId = user.companyId;

        const { server, port, username, password, senderEmail, enableTls } = req.body;

        if (!server || !port || !senderEmail) {
            return res.status(400).json({ error: 'Server, port, and senderEmail are required.' });
        }

        // If password is not provided, fetch existing password to avoid overwriting it with blank
        let finalPassword = password;
        if (!password) {
             const existing = await prisma.systemConfig.findUnique({
                 where: { key_companyId: { key: 'SMTP_SETTINGS', companyId } }
             });
             if (existing && (existing.value as any).password) {
                 finalPassword = (existing.value as any).password;
             }
        }

        const payload = { server, port, username, password: finalPassword, senderEmail, enableTls };

        const config = await prisma.systemConfig.upsert({
            where: { key_companyId: { key: 'SMTP_SETTINGS', companyId } },
            update: { value: payload },
            create: { key: 'SMTP_SETTINGS', companyId, value: payload }
        });

        res.json({ message: 'SMTP settings updated successfully' });
    } catch (error) {
        console.error('Error saving email settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

router.post('/test-smtp', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res) => {
    try {
        const { server, port, username, password, senderEmail, enableTls } = req.body;

        if (!server || !port) {
            return res.status(400).json({ error: 'Server and port are required to test connection.' });
        }

        let finalPassword = password;
        const user = req.user;
        if (!password && user && user.companyId) {
             const existing = await prisma.systemConfig.findUnique({
                 where: { key_companyId: { key: 'SMTP_SETTINGS', companyId: user.companyId } }
             });
             if (existing && (existing.value as any).password) {
                 finalPassword = (existing.value as any).password;
             }
        }

        const transporter = nodemailer.createTransport({
            host: server,
            port: Number(port),
            secure: Number(port) === 465,
            auth: username ? { user: username, pass: finalPassword } : undefined
        });

        await transporter.verify();

        // Actually send a test email to verify delivery
        await transporter.sendMail({
            from: `"${user?.name || 'Swot HR'}" <${senderEmail}>`,
            to: senderEmail,
            subject: 'SMTP Test Successful - Swot HR',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #4f46e5;">SMTP Connection Verified!</h2>
                    <p>This is a test email from your Swot HR system.</p>
                    <p>If you are reading this, your email configuration is 100% correct and ready to use.</p>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
                    <p style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Secure Personnel Protocol Activated</p>
                </div>
            `
        });

        res.json({ message: 'SMTP connection successful and test email sent!' });
    } catch (error: any) {
        console.error('SMTP test failed:', error);
        res.status(400).json({ error: 'SMTP connection failed: ' + error.message });
    }
});

router.get('/noc', authenticate, async (req: AuthRequest, res) => {
    try {
        // Any authenticated user can get the NOC link (e.g. employee needs to view it)
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID required' });

        const config = await prisma.systemConfig.findUnique({
            where: { key_companyId: { key: 'NOC_DRIVE_LINK', companyId } }
        });

        res.json({ link: config?.value || '' });
    } catch (error) {
        console.error('Error fetching NOC link:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/noc', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res) => {
    try {
        const user = req.user;
        if (!user || !user.companyId) return res.status(400).json({ error: 'Company ID required' });
        const companyId = user.companyId;

        const { link } = req.body;

        await prisma.systemConfig.upsert({
            where: { key_companyId: { key: 'NOC_DRIVE_LINK', companyId } },
            update: { value: link },
            create: { key: 'NOC_DRIVE_LINK', companyId, value: link }
        });

        res.json({ message: 'NOC Drive link updated successfully' });
    } catch (error) {
        console.error('Error saving NOC link:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

export default router;
