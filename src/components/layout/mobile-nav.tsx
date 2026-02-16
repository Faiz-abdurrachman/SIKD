"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { getAccessibleMenuItems } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const [open, setOpen] = useState(false);

  const menuItems = role ? getAccessibleMenuItems(role) : [];

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button className="md:hidden" size="icon" variant="outline">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[280px] border-slate-200 p-0" side="left">
        <SheetHeader className="border-b bg-slate-900 px-4 py-4 text-left text-white">
          <SheetTitle className="text-left text-white">SIDESA</SheetTitle>
          <p className="text-xs text-slate-300">Desa Sukamaju</p>
        </SheetHeader>

        <nav className="space-y-1 p-3">
          {menuItems.map((item, index) => {
            if (item.type === "separator") {
              return <Separator className="my-2" key={`sep-${index}`} />;
            }

            const isActive =
              item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Button
                asChild
                className={cn(
                  "w-full justify-start gap-3",
                  isActive ? "bg-blue-700 text-white hover:bg-blue-700" : "hover:bg-slate-100",
                )}
                key={item.href}
                variant={isActive ? "default" : "ghost"}
              >
                <Link href={item.href} onClick={() => setOpen(false)}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
