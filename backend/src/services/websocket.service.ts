import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import prisma from '../config/db';

let wss: WebSocketServer | null = null;

// ── Debounce for triggerDashboardUpdate ──────────────────────────────────────
let pendingUpdate: NodeJS.Timeout | null = null;
const DEBOUNCE_MS = 300; // Coalesce rapid events (e.g. bulk clock-ins)

export function initWebSocket(server: Server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
        console.log('[WS] Client connected');

        // Send initial snapshot immediately on connect
        try {
            const stats = await getLiveStats();
            ws.send(JSON.stringify({ type: 'DASHBOARD_STATS', payload: stats }));
        } catch (err) {
            console.error('[WS] Initial send failed:', err);
        }

        ws.on('message', (msg: any) => {
            try {
                const data = JSON.parse(msg.toString());
                if (data.type === 'PING') {
                    ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
                }
            } catch {}
        });

        ws.on('close', () => console.log('[WS] Client disconnected'));
        ws.on('error', (err) => console.error('[WS] Error:', err));
    });

    // Broadcast live stats every 3 seconds for low latency
    setInterval(async () => {
        if (!wss || wss.clients.size === 0) return;
        try {
            const stats = await getLiveStats();
            const msg = JSON.stringify({ type: 'DASHBOARD_STATS', payload: stats });
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(msg);
                }
            });
        } catch (err) {
            console.error('[WS] Broadcast failed:', err);
        }
    }, 3_000);

    console.log('[WS] WebSocket server initialized on path /ws');
    return wss;
}

export function broadcast(type: string, payload: any) {
    if (!wss) return;
    const msg = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

/**
 * Debounced dashboard update — coalesces rapid events (e.g. multiple
 * employees clocking in at 9 AM) into a single DB query + broadcast.
 */
export async function triggerDashboardUpdate() {
    if (!wss) return;
    if (pendingUpdate) clearTimeout(pendingUpdate);
    pendingUpdate = setTimeout(async () => {
        pendingUpdate = null;
        try {
            const stats = await getLiveStats();
            broadcast('DASHBOARD_STATS', stats);
        } catch (err) {
            console.error('[WS] Immediate broadcast failed:', err);
        }
    }, DEBOUNCE_MS);
}

/**
 * Broadcast activity event for instant activity feed updates.
 */
export function broadcastActivityEvent(action: string, description: string, adminName?: string) {
    broadcast('ACTIVITY_EVENT', {
        action,
        description,
        admin: { name: adminName || 'System' },
        createdAt: new Date().toISOString(),
    });
}

// ── Optimized stats query — single parallel batch ────────────────────────────
async function getLiveStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd   = new Date(todayStart.getTime() + 86_400_000);

    const [
        totalEmployees,
        clockedInToday,
        pendingLeaves,
        approvedLeaves,
        leavesToday,
        departments,
    ] = await Promise.all([
        prisma.user.count({ 
            where: { 
                status: 'ACTIVE',
                role: { name: { not: 'SUPER_ADMIN' } }
            } 
        }),
        prisma.timeEntry.count({
            where: {
                clockIn: { gte: todayStart, lt: todayEnd },
                clockOut: null,
            },
        }).catch(() => 0),
        prisma.leaveRequest.count({ where: { status: 'PENDING' } }).catch(() => 0),
        prisma.leaveRequest.count({ 
            where: { 
                status: 'APPROVED',
                updatedAt: { gte: todayStart, lt: todayEnd }
            } 
        }).catch(() => 0),
        prisma.leaveRequest.count({
            where: {
                status: 'APPROVED',
                startDate: { lte: todayEnd },
                endDate:   { gte: todayStart },
            },
        }).catch(() => 0),
        (prisma as any).department.findMany({
            include: { _count: { select: { users: true } } }
        }).catch(() => []),
    ]);

    return {
        totalEmployees,
        activeToday: clockedInToday,
        pendingApprovals: pendingLeaves,
        leaveApproved: approvedLeaves,
        leaveToday: leavesToday,
        departmentMetrics: departments.map((d: any) => ({
            name: d.name,
            staff: d._count?.users || 0,
        })),
        timestamp: now.toISOString(),
    };
}
