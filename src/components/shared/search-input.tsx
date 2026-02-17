"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Cari data...",
  delay = 300,
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) {
      return;
    }

    const timer = window.setTimeout(() => {
      onChangeRef.current(localValue);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, localValue, value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        className="h-10 rounded-lg border-slate-300/80 bg-white pl-10 pr-10 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        onChange={(event) => setLocalValue(event.target.value)}
        placeholder={placeholder}
        value={localValue}
      />

      {localValue ? (
        <Button
          className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md"
          onClick={() => setLocalValue("")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="h-4 w-4 text-slate-500" />
        </Button>
      ) : null}
    </div>
  );
}
