import prisma from '../config/db';
import cache from '../config/cache';

const HOLIDAYS_2026 = [
    { name: 'Makar Sankranti', date: '2026-01-14' },
    { name: 'Republic Day', date: '2026-01-26', isNational: true },
    { name: 'Holi', date: '2026-03-03' },
    { name: 'Id-ul-Fitr', date: '2026-03-21' },
    { name: 'Ram Navami', date: '2026-03-26' },
    { name: 'Mahavir Jayanti', date: '2026-03-31' },
    { name: 'Good Friday', date: '2026-04-03' },
    { name: 'Buddha Purnima', date: '2026-05-01' },
    { name: 'Bakrid / Eid al-Adha', date: '2026-05-27' },
    { name: 'Muharram', date: '2026-06-26' },
    { name: 'Independence Day', date: '2026-08-15', isNational: true },
    { name: 'Janmashtami', date: '2026-09-04' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', isNational: true },
    { name: 'Dussehra', date: '2026-10-20' },
    { name: 'Diwali', date: '2026-11-08' },
    { name: 'Guru Nanak Jayanti', date: '2026-11-24' },
    { name: 'Christmas Day', date: '2026-12-25' },
];

export const syncHolidays = async (year: number, companyId: string) => {
    // In a real app, this would fetch from an API like Nager.Date
    // For now, we seed hardcoded data for 2026

    const holidays = year === 2026 ? HOLIDAYS_2026 : [];

    console.log(`Syncing holidays for ${year} (Company: ${companyId})... Found ${holidays.length} entries.`);

    let createdCount = 0;
    for (const h of holidays) {
        const date = new Date(h.date);

        // Upsert to avoid duplicates per company
        await prisma.holiday.upsert({
            where: { date_companyId: { date: date, companyId: companyId } },
            update: { name: h.name },
            create: {
                name: h.name,
                date: date,
                year: year,
                isFloater: false,
                companyId: companyId
            }
        });
        createdCount++;
    }

    cache.del(`holidays_${year}_${companyId}`);
    return { count: createdCount, message: `Synced ${createdCount} holidays for ${year}` };
};

export const getHolidays = async (year: number, companyId: string) => {
    const key = `holidays_${year}_${companyId}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const holidays = await prisma.holiday.findMany({
        where: { year, companyId },
        orderBy: { date: 'asc' }
    });

    cache.set(key, holidays, 86400); // 24 hours
    return holidays;
};

export const createHoliday = async (data: { name: string; date: Date; year: number; isFloater: boolean; companyId: string }) => {
    const holiday = await prisma.holiday.create({
        data
    });
    cache.del(`holidays_${data.year}_${data.companyId}`);
    return holiday;
};

export const deleteHoliday = async (id: string, companyId: string) => {
    const holiday = await prisma.holiday.findFirst({
        where: { id, companyId }
    });
    if (!holiday) return null;

    await prisma.holiday.delete({ where: { id } });
    cache.del(`holidays_${holiday.year}_${companyId}`);
    return holiday;
};
