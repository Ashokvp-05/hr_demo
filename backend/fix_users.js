const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fix() {
  const company = await prisma.company.findFirst({ select: { id: true } });
  
  // Create AUDITOR role
  console.log('Creating AUDITOR role...');
  let auditorRole;
  try {
    auditorRole = await prisma.role.create({
      data: {
        name: 'AUDITOR',
        description: 'Read-only audit access to all system records',
        companyId: company.id,
        status: 'ACTIVE',
        permissions: {}
      }
    });
    console.log('✅ Created AUDITOR role:', auditorRole.id);
  } catch (e) {
    // Role may already exist with different case
    auditorRole = await prisma.role.findFirst({ where: { name: { contains: 'AUDIT' } } });
    console.log('Using existing role:', auditorRole?.name, auditorRole?.id);
  }

  // Create auditor@hr-central.com
  const auditHash = await bcrypt.hash('Audit@Secure2026', 10);
  const existing = await prisma.user.findUnique({ where: { email: 'auditor@hr-central.com' } });
  
  if (!existing && auditorRole && company) {
    await prisma.user.create({
      data: {
        email: 'auditor@hr-central.com',
        name: 'System Auditor',
        password: auditHash,
        roleId: auditorRole.id,
        companyId: company.id,
        status: 'ACTIVE',
      }
    });
    console.log('✅ Created auditor@hr-central.com');
  } else if (existing) {
    await prisma.user.update({ where: { email: 'auditor@hr-central.com' }, data: { password: auditHash } });
    console.log('✅ Updated auditor@hr-central.com password');
  }

  // Final verification of all target users
  console.log('\n📋 Final user list:');
  const finalUsers = await prisma.user.findMany({
    select: { email: true, status: true },
    orderBy: { email: 'asc' }
  });
  finalUsers.forEach(u => console.log(`  ✔ ${u.email} [${u.status}]`));
}

fix().then(() => prisma.$disconnect()).catch(e => { console.error('Error:', e.message); process.exit(1); });
