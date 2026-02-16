"use client";

import { signOut, useSession } from "next-auth/react";

import { canAccess as canAccessPermission, type UserRole } from "@/lib/rbac";

export function useAuth() {
  const { data, status } = useSession();

  const role = data?.user?.role as UserRole | undefined;

  const canAccess = (resource: string, action: string) => {
    if (!role) {
      return false;
    }

    return canAccessPermission(role, resource, action);
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return {
    user: data?.user ?? null,
    role,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    canAccess,
    logout,
  };
}
