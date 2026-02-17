import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";

loadEnv({ path: ".env" });

if (existsSync(".env.local")) {
  // Keep Prisma CLI env resolution aligned with Next.js local runtime.
  loadEnv({ path: ".env.local", override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: 'ts-node --compiler-options {"module":"commonjs"} prisma/seed.ts',
  },
});
