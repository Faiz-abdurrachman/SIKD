import { existsSync } from "node:fs";

import { compare } from "bcryptjs";
import { config as loadEnv } from "dotenv";

import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env" });
if (existsSync(".env.local")) {
  loadEnv({ path: ".env.local", override: true });
}

const prisma = new PrismaClient();

const EXPECTED_USERS = [
  { username: "admin", role: "SUPER_ADMIN", password: "Admin@2026" },
  { username: "kades", role: "KEPALA_DESA", password: "User@2026" },
  { username: "sekdes", role: "SEKRETARIS", password: "User@2026" },
  { username: "operator", role: "OPERATOR", password: "User@2026" },
];

async function run() {
  let hasError = false;

  try {
    const users = await prisma.user.findMany({
      select: {
        username: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
      orderBy: { username: "asc" },
    });

    console.log("Seed user check:");
    for (const expected of EXPECTED_USERS) {
      const found = users.find((user) => user.username === expected.username);

      if (!found) {
        hasError = true;
        console.error(`- ${expected.username}: MISSING`);
        continue;
      }

      const passwordOk = await compare(expected.password, found.passwordHash);
      const roleOk = found.role === expected.role;
      const activeOk = found.isActive === true;

      console.log(
        `- ${expected.username}: role=${found.role} active=${found.isActive} password=${passwordOk ? "OK" : "FAIL"}`,
      );

      if (!passwordOk || !roleOk || !activeOk) {
        hasError = true;
      }
    }
  } catch (error) {
    hasError = true;
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to check seed users:", message);
  } finally {
    await prisma.$disconnect();
  }

  if (hasError) {
    process.exitCode = 1;
    console.error("Result: FAILED");
    return;
  }

  console.log("Result: OK");
}

await run();
