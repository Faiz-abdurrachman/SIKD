"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type AsyncComboboxOption = {
  value: string;
  label: string;
  description?: string;
};

type AsyncComboboxProps = {
  value: string;
  onValueChange: (value: string) => void;
  selectedLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  noQueryText?: string;
  minQueryLength?: number;
  disabled?: boolean;
  className?: string;
  fetchOptions: (query: string) => Promise<AsyncComboboxOption[]>;
  onFetchError?: (error: unknown) => void;
};

export function AsyncCombobox({
  value,
  onValueChange,
  selectedLabel,
  placeholder = "Pilih data",
  searchPlaceholder = "Cari data...",
  emptyText = "Data tidak ditemukan.",
  noQueryText,
  minQueryLength = 2,
  disabled = false,
  className,
  fetchOptions,
  onFetchError,
}: AsyncComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<AsyncComboboxOption[]>([]);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setOptions([]);
      setIsLoading(false);
      requestIdRef.current += 1;
      return;
    }

    const normalizedQuery = query.trim();

    if (normalizedQuery.length < minQueryLength) {
      setOptions([]);
      setIsLoading(false);
      requestIdRef.current += 1;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const nextOptions = await fetchOptions(normalizedQuery);

        if (requestIdRef.current === requestId) {
          setOptions(nextOptions);
        }
      } catch (error) {
        if (requestIdRef.current === requestId) {
          setOptions([]);
        }

        onFetchError?.(error);
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [fetchOptions, minQueryLength, onFetchError, open, query]);

  const emptyMessage = useMemo(() => {
    if (isLoading) {
      return "Mencari data...";
    }

    if (query.trim().length < minQueryLength) {
      return noQueryText ?? `Ketik minimal ${minQueryLength} karakter...`;
    }

    return emptyText;
  }, [emptyText, isLoading, minQueryLength, noQueryText, query]);

  const triggerLabel = value ? (selectedLabel ?? "Data dipilih") : placeholder;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("w-full justify-between rounded-lg border-slate-300/80", className)}
          disabled={disabled}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className={cn("truncate text-left", !value ? "text-slate-500" : "")}>{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput onValueChange={setQuery} placeholder={searchPlaceholder} value={query} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                  value={`${option.label} ${option.description ?? ""}`.trim()}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{option.label}</p>
                    {option.description ? (
                      <p className="truncate text-xs text-slate-500">{option.description}</p>
                    ) : null}
                  </div>
                  {isLoading ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin text-slate-400" />
                  ) : value === option.value ? (
                    <Check className="ml-2 h-4 w-4 text-slate-700" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
