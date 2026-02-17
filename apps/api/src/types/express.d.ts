import type { AppRole } from "../lib/rbac";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        nama: string;
        role: AppRole;
      };
    }
  }
}

export {};
