// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create a new user
  await prisma.user.create({
    data: {
      email: "maryamshabir025@gmail.com",
      name: "Maryam Shabir",
      password: await bcrypt.hash("testpassword", 12),
    },
  });
  console.log("User created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
