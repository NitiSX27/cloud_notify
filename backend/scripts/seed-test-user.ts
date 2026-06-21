import { prisma } from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "test.citizen@example.com" },
    update: {},
    create: {
      id: "test-user-1",
      name: "Test Citizen",
      email: "test.citizen@example.com",
    },
  });

  console.log(user.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
