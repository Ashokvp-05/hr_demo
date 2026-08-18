import * as authService from './src/services/auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRegister() {
    try {
        console.log('Testing registerCompany...');
        const result = await authService.registerCompany({
            companyName: 'Test Corp ' + Date.now(),
            adminName: 'Admin Guy',
            email: 'admin' + Date.now() + '@test.com',
            password: 'password123',
            plan: 'FREE'
        });
        console.log('Success:', result);
    } catch (error) {
        console.error('FAILED:', error);
    }
}

testRegister()
    .finally(async () => {
        await prisma.$disconnect();
    });
