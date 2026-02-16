"use client";

import { LogOut, UserCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABEL } from "@/lib/constants";

function formatSegment(segment: string) {
  return segment
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Header() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => formatSegment(segment));

  const displayName = user?.nama || user?.name || "Pengguna";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div>
          <p className="text-xs text-slate-500">Breadcrumb</p>
          <p className="text-sm font-medium text-slate-800">
            Dashboard
            {segments.length ? ` > ${segments.join(" > ")}` : ""}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-auto gap-2 px-2 py-1.5" variant="ghost">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-200 text-slate-700">{initials || "U"}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight text-slate-800">{displayName}</p>
              {role ? (
                <Badge className="mt-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100" variant="secondary">
                  {ROLE_LABEL[role]}
                </Badge>
              ) : null}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Akun</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserCircle2 className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
