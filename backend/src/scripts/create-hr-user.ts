import prisma from '../config/db';
import bcrypt from 'bcryptjs';

async function main() {
    const hrEmail = 'hr@hrms.com';
    const hrPassword = 'HR_Secure_' + Math.random().toString(36).slice(-8); // Generate a unique suffix
    const hashedPassword = await bcrypt.hash(hrPassword, 12);

    // 0. Ensure Company exists
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: { name: 'HR Corp', subdomain: 'hr' }
        });
    }

    // 1. Ensure HR Role exists
    let hrRole = await prisma.role.findFirst({ where: { name: 'HR', companyId: company.id } });
    if (!hrRole) {
        console.log('Creating HR role...');
        hrRole = await prisma.role.create({
            data: {
                name: 'HR',
                companyId: company.id,
                permissions: {
                    canManageUsers: true,
                    canApproveLeaves: true,
                    canEditAttendance: true,
                    canExportReports: true,
                    canConfigureSystem: false,
                    canViewAuditLogs: false
                }
            }
        });
    }

    // 2. Create HR User
    const hrUser = await prisma.user.upsert({
        where: { email: hrEmail },
        update: {
            password: hashedPassword,
            status: 'ACTIVE',
            role: { connect: { id: hrRole.id } }
        },
        create: {
            email: hrEmail,
            name: 'HR Manager',
            password: hashedPassword,
            status: 'ACTIVE',
            department: {
                connectOrCreate: {
                    where: { name_companyId: { name: 'Human Resources', companyId: company.id } },
                    create: { name: 'Human Resources', companyId: company.id }
                }
            },
            designation: {
                connectOrCreate: {
                    where: { name_companyId: { name: 'HR Specialist', companyId: company.id } },
                    create: { name: 'HR Specialist', companyId: company.id }
                }
            },
            role: { connect: { id: hrRole.id } }
        }
    });

    console.log('-----------------------------------');
    console.log('✅ HR User created/updated successfully!');
    console.log(`ID: ${hrUser.id}`);
    console.log(`Email: ${hrEmail}`);
    console.log(`Password: ${hrPassword}`);
    console.log('-----------------------------------');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
