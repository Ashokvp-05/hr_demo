/**
 * Seeded system accounts — these exist in the database for
 * initial login / admin bootstrap purposes but should be hidden
 * from all employee lists, attendance views, and user counts
 * so they don't inflate real workforce metrics.
 *
 * To add or remove hidden accounts, update this list.
 */
export const SEEDED_SYSTEM_EMAILS: string[] = [
    'viswa.s@rudratic.com',
    'marx.rudratic@gmail.com',
    'sam@rudratic.com',
    'hr@hrms.com',
    'dev_lead@hrms.com',
    'employee@hrms.com',
    'auditor@hr-central.com',
    'support@hr-central.com',
];
