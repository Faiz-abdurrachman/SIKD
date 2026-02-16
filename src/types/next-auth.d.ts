import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      nama: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    nama: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    nama?: string;
    role?: UserRole;
  }
}
