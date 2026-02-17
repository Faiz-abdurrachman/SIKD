import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  className?: string;
};

export function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <Card className={cn("surface-card py-0", className)}>
      <CardHeader className="surface-header flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{title}</CardTitle>
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="surface-body pt-1">
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
        {trend ? <p className="mt-1 text-xs font-medium text-emerald-700">{trend}</p> : null}
      </CardContent>
    </Card>
  );
}
