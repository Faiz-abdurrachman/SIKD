"use client";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: keyof TData & string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  serverPagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onServerPageChange?: (page: number) => void;
  onServerPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  searchPlaceholder?: string;
  isLoading?: boolean;
};

function DataTableComponent<TData, TValue>({
  columns,
  data,
  searchKey,
  searchValue = "",
  onSearchChange,
  serverPagination,
  onServerPageChange,
  onServerPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  searchPlaceholder = "Cari data...",
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [search, setSearch] = useState("");
  const isServerMode = Boolean(serverPagination && onServerPageChange && onServerPageSizeChange);

  const filteredData = useMemo(() => {
    if (isServerMode) {
      return data;
    }

    if (!searchKey || !search.trim()) {
      return data;
    }

    const query = search.trim().toLowerCase();

    return data.filter((item) => String(item[searchKey] ?? "").toLowerCase().includes(query));
  }, [data, isServerMode, search, searchKey]);

  const tableData = isServerMode ? data : filteredData;

  // TanStack Table manages internal mutable state; this hook is expected here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    ...(isServerMode
      ? {}
      : {
          getSortedRowModel: getSortedRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          initialState: {
            pagination: {
              pageIndex: 0,
              pageSize: 10,
            },
          },
        }),
  });

  const pageSize = isServerMode
    ? (serverPagination?.pageSize ?? 10)
    : table.getState().pagination.pageSize;
  const pageIndex = isServerMode
    ? ((serverPagination?.page ?? 1) - 1)
    : table.getState().pagination.pageIndex;
  const pageCount = isServerMode
    ? Math.max(serverPagination?.totalPages ?? 1, 1)
    : table.getPageCount();
  const total = serverPagination?.total ?? tableData.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);
  const rowModel = table.getRowModel();
  const hasRows = rowModel.rows.length > 0;

  return (
    <div className="dashboard-layout">
      {isServerMode && onSearchChange ? (
        <SearchInput
          className="max-w-xl"
          onChange={(value) => {
            if (value === searchValue) {
              return;
            }

            onSearchChange(value);
          }}
          placeholder={searchPlaceholder}
          value={searchValue}
        />
      ) : null}

      {!isServerMode && searchKey ? (
        <SearchInput
          className="max-w-xl"
          onChange={setSearch}
          placeholder={searchPlaceholder}
          value={search}
        />
      ) : null}

      <div className="surface-card overflow-hidden">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {columns.map((column, columnIndex) => (
                      <TableCell key={`${String(column.id ?? columnIndex)}-${index}`}>
                        <Skeleton className="h-4 w-full rounded-md" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : hasRows
                ? rowModel.rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : (
                  <TableRow>
                    <TableCell className="px-4 py-8" colSpan={columns.length}>
                      <EmptyState
                        description="Coba ubah kata kunci pencarian atau filter data."
                        title="Belum ada data"
                      />
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </div>

      <div className="surface-card flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-slate-600">
          {isServerMode ? (
            <>
              Menampilkan <span className="font-medium">{start}</span>-<span className="font-medium">{end}</span>{" "}
              dari <span className="font-medium">{total}</span> data
            </>
          ) : (
            <>
              Menampilkan halaman <span className="font-medium">{pageIndex + 1}</span> dari{" "}
              <span className="font-medium">{Math.max(pageCount, 1)}</span>
            </>
          )}
        </p>

        <div className="flex items-center gap-2">
          <Select
            onValueChange={(value) => {
              const nextSize = Number(value);

              if (isServerMode) {
                onServerPageSizeChange?.(nextSize);
                return;
              }

              table.setPageSize(nextSize);
            }}
            value={String(pageSize)}
          >
            <SelectTrigger className="h-9 w-[110px] rounded-lg border-slate-300/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            aria-label="Halaman sebelumnya"
            disabled={isServerMode ? pageIndex <= 0 : !table.getCanPreviousPage()}
            onClick={() => {
              if (isServerMode) {
                onServerPageChange?.(Math.max(1, pageIndex));
                return;
              }

              table.previousPage();
            }}
            className="h-9 w-9 rounded-lg border-slate-300/80"
            size="icon"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Halaman berikutnya"
            disabled={isServerMode ? pageIndex + 1 >= pageCount : !table.getCanNextPage()}
            onClick={() => {
              if (isServerMode) {
                onServerPageChange?.(Math.min(pageCount, pageIndex + 2));
                return;
              }

              table.nextPage();
            }}
            className="h-9 w-9 rounded-lg border-slate-300/80"
            size="icon"
            variant="outline"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function areDataTablePropsEqual<TData, TValue>(
  prev: DataTableProps<TData, TValue>,
  next: DataTableProps<TData, TValue>,
) {
  return (
    prev.columns === next.columns
    && prev.data === next.data
    && prev.searchKey === next.searchKey
    && prev.searchValue === next.searchValue
    && prev.serverPagination === next.serverPagination
    && prev.onSearchChange === next.onSearchChange
    && prev.onServerPageChange === next.onServerPageChange
    && prev.onServerPageSizeChange === next.onServerPageSizeChange
    && prev.pageSizeOptions === next.pageSizeOptions
    && prev.searchPlaceholder === next.searchPlaceholder
    && prev.isLoading === next.isLoading
  );
}

export const DataTable = memo(DataTableComponent, areDataTablePropsEqual) as typeof DataTableComponent;
