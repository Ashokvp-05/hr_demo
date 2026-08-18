import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/db';

// Simple regex-based intent matching for MVP
// Simple regex-based intent matching for MVP
export const chat = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        const authReq = req as AuthRequest;
        const userId = authReq.user?.id;
        const msg = message.toLowerCase();

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        let responseText = "";

        // HELPER: Check for keywords
        const has = (...words: string[]) => words.some(w => msg.includes(w));
        const hasAll = (...words: string[]) => words.every(w => msg.includes(w));

        // INTENT 1: LEAVE BALANCE & STATUS
        if (has('leave', 'vacation', 'off') && has('balance', 'many', 'left', 'remaining', 'status')) {
            const balances = await prisma.leaveBalance.findMany({
                where: { userId },
                include: { leaveTypeConfig: true }
            });

            if (balances.length > 0) {
                let text = "🌴 **Your Leave Balances:**\n";
                balances.forEach(b => {
                    const available = (b.total || 0) - (b.used || 0);
                    text += `- ${b.leaveTypeConfig.name}: ${available} days left (Total: ${b.total})\n`;
                });
                responseText = text + "\nNeed a break? Apply in the Leave tab!";
            } else {
                responseText = "I couldn't find your leave balance records. Please contact HR.";
            }
        }

        // INTENT 2: ATTENDANCE & HOURS
        else if (has('attendance', 'hours', 'work', 'clock', 'time')) {
            const today = new Date();
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); // Sunday

            const entries = await prisma.timeEntry.findMany({
                where: {
                    userId,
                    clockIn: { gte: startOfWeek }
                }
            });

            const totalHours = entries.reduce((acc, entry) => acc + (Number(entry.hoursWorked) || 0), 0);
            responseText = `⏱️ **Weekly Summary:**\n- Total Hours: ${totalHours.toFixed(1)} hrs\n- Sessions: ${entries.length}\n\nDon't forget to take breaks! ☕`;
        }

        // INTENT 3: HOLIDAYS
        else if (has('holiday', 'festival', 'off day', 'closed')) {
            const nextHoliday = await prisma.holiday.findFirst({
                where: { date: { gte: new Date() } },
                orderBy: { date: 'asc' }
            });

            if (nextHoliday) {
                const dateStr = new Date(nextHoliday.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                responseText = `🎉 **Next Holiday:**\n${nextHoliday.name} on ${dateStr}.\n\nPlan your long weekend! 🗓️`;
            } else {
                responseText = "No upcoming holidays found for this year. Time to work hard! 💪";
            }
        }

        // INTENT 4: KUDOS / APPRECIATION
        else if (has('kudos', 'appreciation', 'praise', 'star')) {
            const kudosCount = await prisma.kudos.count({ where: { toUserId: userId } });
            const recentKudos = await prisma.kudos.findFirst({
                where: { toUserId: userId },
                orderBy: { createdAt: 'desc' },
                include: { fromUser: { select: { name: true } } }
            });

            if (kudosCount > 0) {
                responseText = `🌟 **You're a Star!**\nYou have received ${kudosCount} kudos so far.\n\nLatest from ${recentKudos?.fromUser.name}: "${recentKudos?.message}"`;
            } else {
                responseText = "No kudos yet, but keep doing great work and they'll come! 🚀";
            }
        }

        // INTENT 5: POLICY / GENERAL
        else if (has('policy', 'rule', 'handbook')) {
            if (has('overtime')) {
                responseText = "📜 **Overtime Policy:**\nWork beyond 9 hours/day is eligible for overtime (1.5x rate). Requires manager approval.";
            } else if (has('leave', 'sick')) {
                responseText = "📜 **Leave Policy:**\n- Casual: Apply 48hrs in advance.\n- Sick: Can be applied same-day.\n- Earned: Pro-rated monthly.";
            } else {
                responseText = "You can find the full Employee Handbook in the 'Company' section of your dashboard.";
            }
        }

        // INTENT 6: GREETING & PERSONAL
        else if (has('hi', 'hello', 'hey', 'morning', 'nexus')) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            responseText = `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋\nI'm Nexus, your HR Assistant.\n\nAsk me about:\n- Leave Balance\n- Attendance\n- Upcoming Holidays\n- Recent Kudos\n- Policies`;
        }

        // INTENT 7: TICKET / HELP
        else if (has('ticket', 'issue', 'bug', 'problem', 'broken')) {
            responseText = "🛠️ **Support:**\nTo report an issue, click the 'Support' button (Life Preserver icon) in the bottom right corner.\n\nResponse time is usually < 4 hours.";
        }

        // DEFAULT FALLBACK
        else {
            responseText = "I'm not sure about that yet. 🤔\n\nTry asking about:\n• 'My leave balance'\n• 'Next holiday'\n• 'My working hours'\n• 'HR policies'";
        }

        res.json({ reply: responseText });
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: "My circuits are tangled. Please try again later." });
    }
};
