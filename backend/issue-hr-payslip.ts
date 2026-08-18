
import prisma from './src/config/db';
import * as payslipService from './src/services/payslip.service';
import { PayrollStatus } from '@prisma/client';

async function issueHRPayslip() {
    const userId = 'a0c47ce3-df1c-46a7-8332-22a5dbbd97fc'; // Hannah HR
    const month = 'February';
    const year = 2026;

    console.log("Checking user...");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log("Setting up salary config for HR...");
    const salary = await prisma.salaryConfig.upsert({
        where: { userId },
        update: {},
        create: {
            userId,
            basicSalary: 120000,
            hra: 40000,
            da: 10000,
            bonus: 5000,
            otherAllowances: 2000,
            pf: 12000,
            tax: 8000
        }
    });

    console.log("Calculating and generating payslip...");
    const totalAmount = Number(salary.basicSalary) +
        Number(salary.hra) +
        Number(salary.da) +
        Number(salary.bonus) +
        Number(salary.otherAllowances) -
        Number(salary.pf) -
        Number(salary.tax);

    const payslip = await payslipService.generatePayslipFromTemplate(
        userId,
        month,
        year,
        totalAmount,
        {
            hra: Number(salary.hra),
            da: Number(salary.da),
            bonus: Number(salary.bonus),
            otherAllowances: Number(salary.otherAllowances),
            pf: Number(salary.pf),
            tax: Number(salary.tax)
        }
    );

    console.log("Releasing payslip...");
    await payslipService.releasePayslip(payslip.id, user.companyId as string);

    console.log(`Successfully generated and issued payslip for ${user.name} (${month} ${year})`);
    console.log(`Total Net Amount: $${totalAmount.toLocaleString()}`);
    console.log(`File: ${payslip.fileUrl}`);
}

issueHRPayslip()
    .catch(err => console.error(err))
    .finally(() => prisma.$disconnect());
