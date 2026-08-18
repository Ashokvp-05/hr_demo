import prisma from './src/config/db';
import { getActiveEntry } from './src/services/timeEntry.service';
import { TimeEntryStatus } from '@prisma/client';

async function main() {
    console.log("TimeEntryStatus.ACTIVE:", TimeEntryStatus.ACTIVE);
    console.log("String active:", 'ACTIVE');
    
    // Find any user with an active entry
    const active = await prisma.timeEntry.findFirst({ where: { status: 'ACTIVE' } });
    if (!active) {
        console.log("No active entry found in DB.");
        process.exit(0);
    }
    console.log("Found active entry in DB:", active.id);
    
    const fetched = await getActiveEntry(active.userId, active.companyId!);
    console.log("getActiveEntry result:", fetched ? fetched.id : null);
}

main().catch(console.error).finally(() => prisma.$disconnect());
