import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  text?: string;
  fullPage?: boolean;
  className?: string;
};

export function LoadingSpinner({ text = "Memuat...", fullPage = false, className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-slate-600",
        fullPage ? "min-h-[50vh]" : "py-6",
        className,
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
