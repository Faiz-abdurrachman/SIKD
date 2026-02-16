"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { getAccessibleMenuItems } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();

  const menuItems = role ? getAccessibleMenuItems(role) : [];

  return (
    <aside
      className={cn(
        "hidden border-r border-slate-800 bg-slate-900 text-slate-300 md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col",
        collapsed ? "md:w-20" : "md:w-[250px]",
      )}
    >
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-700 font-bold text-white">
            S
          </div>
          {!collapsed ? (
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">SIDESA</p>
              <p className="text-xs text-slate-400">Desa Sukamaju</p>
            </div>
          ) : null}
        </div>
      </div>

      <Separator className="bg-slate-800" />

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {menuItems.map((item, index) => {
          if (item.type === "separator") {
            return <Separator className="my-2 bg-slate-800" key={`sep-${index}`} />;
          }

          const isActive =
            item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Button
              asChild
              className={cn(
                "w-full justify-start gap-3 border-l-2 border-transparent text-slate-200 hover:bg-slate-800 hover:text-white",
                collapsed ? "px-2" : "px-3",
                isActive ? "border-blue-400 bg-blue-700/50 text-white" : "",
              )}
              key={item.href}
              variant="ghost"
            >
              <Link href={item.href} title={collapsed ? item.label : undefined}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            </Button>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-2">
        <Button
          className="w-full justify-center text-slate-200 hover:bg-slate-800 hover:text-white"
          onClick={onToggle}
          size="sm"
          type="button"
          variant="ghost"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
