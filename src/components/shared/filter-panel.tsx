"use client";

import { ChevronDown, Filter } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterPanelProps = {
  isOpen: boolean;
  children: ReactNode;
  onToggle?: () => void;
  activeCount?: number;
  title?: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  scrollable?: boolean;
};

type FilterToggleButtonProps = {
  isOpen: boolean;
  onToggle: () => void;
  activeCount?: number;
  label?: string;
  className?: string;
};

type FilterActionsProps = {
  onApply: () => void;
  onReset: () => void;
  applyLabel?: string;
  resetLabel?: string;
  className?: string;
  applyDisabled?: boolean;
  resetDisabled?: boolean;
};

export function FilterToggleButton({
  isOpen,
  onToggle,
  activeCount = 0,
  label = "Filter",
  className,
}: FilterToggleButtonProps) {
  return (
    <Button
      className={cn(
        "h-9 shrink-0 rounded-lg border-slate-300/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50",
        className,
      )}
      onClick={onToggle}
      size="sm"
      type="button"
      variant="outline"
    >
      <Filter className="mr-2 h-4 w-4 text-slate-500" />
      <span className="font-medium text-slate-700">{label}</span>
      {activeCount > 0 ? (
        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {activeCount}
        </span>
      ) : null}
      <ChevronDown className={cn("ml-2 h-4 w-4 text-slate-500 transition-transform", isOpen ? "rotate-180" : "rotate-0")} />
    </Button>
  );
}

export function FilterActions({
  onApply,
  onReset,
  applyLabel = "Terapkan",
  resetLabel = "Reset",
  className,
  applyDisabled = false,
  resetDisabled = false,
}: FilterActionsProps) {
  return (
    <div className={cn("actions-row pt-1", className)}>
      <Button
        className="min-w-24 rounded-lg"
        disabled={applyDisabled}
        onClick={onApply}
        type="button"
      >
        {applyLabel}
      </Button>
      <Button
        className="min-w-20 rounded-lg"
        disabled={resetDisabled}
        onClick={onReset}
        type="button"
        variant="outline"
      >
        {resetLabel}
      </Button>
    </div>
  );
}

export function FilterPanel({
  isOpen,
  children,
  onToggle,
  activeCount = 0,
  title = "Filter Data",
  description,
  className,
  contentClassName,
  scrollable = true,
}: FilterPanelProps) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out",
        isOpen ? "mt-0 grid-rows-[1fr] opacity-100" : "-mt-2 grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div aria-hidden={!isOpen} className="overflow-hidden">
        <div className="surface-card overflow-hidden">
          {onToggle ? (
            <div className="surface-header flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  {activeCount > 0 ? <span className="text-xs text-slate-500">({activeCount} aktif)</span> : null}
                </div>
                {description ? <p className="text-xs text-slate-500">{description}</p> : null}
              </div>

              <FilterToggleButton
                activeCount={activeCount}
                isOpen={isOpen}
                label="Filter"
                onToggle={onToggle}
              />
            </div>
          ) : (
            <div className="surface-header">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-800">{title}</p>
                {activeCount > 0 ? <span className="text-xs text-slate-500">({activeCount} aktif)</span> : null}
              </div>
              {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
            </div>
          )}

          <div
            className={cn(
              "surface-body",
              onToggle ? "border-t border-slate-100" : "",
              scrollable ? "max-h-[68vh] overflow-y-auto" : "",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
