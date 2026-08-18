
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Ashok%40005@localhost:5432/antigravity_db"
    }
  }
});

async function main() {
  try {
    await prisma.$connect();
    console.log("Success: Database connected successfully!");
    const userCount = await prisma.user.count();
    console.log(`Current User count: ${userCount}`);
  } catch (e) {
    console.error("Error: Could not connect to database.");
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
