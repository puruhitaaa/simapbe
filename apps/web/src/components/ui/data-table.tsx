"use client";

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  // Server-side pagination
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  // Search
  onSearchChange?: (value: string) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Cari...",
  isLoading = false,
  pageCount,
  pageIndex: externalPageIndex,
  pageSize: externalPageSize,
  onPaginationChange,
  onSearchChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [searchValue, setSearchValue] = useState("");
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Use server-side pagination if provided
  const isServerSide = pageCount !== undefined;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: isServerSide ? undefined : getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: isServerSide ? undefined : setInternalPagination,
    manualPagination: isServerSide,
    pageCount: pageCount ?? -1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: isServerSide
        ? {
            pageIndex: externalPageIndex ?? 0,
            pageSize: externalPageSize ?? 10,
          }
        : internalPagination,
    },
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (onSearchChange) {
      onSearchChange(value);
    } else if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      {/* Search */}
      {(searchKey || onSearchChange) && (
        <div className="flex items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              value={searchValue}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-muted-foreground">Memuat...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  <span className="text-muted-foreground">
                    Tidak ada data ditemukan
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} dari{" "}
              {table.getFilteredRowModel().rows.length} baris dipilih
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => {
              if (isServerSide && onPaginationChange) {
                onPaginationChange(
                  (externalPageIndex ?? 0) - 1,
                  externalPageSize ?? 10
                );
              } else {
                table.previousPage();
              }
            }}
            size="sm"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          <span className="text-sm">
            Halaman{" "}
            {(externalPageIndex ??
              table.getState().pagination?.pageIndex ??
              0) + 1}
            {pageCount !== undefined && ` dari ${pageCount}`}
          </span>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => {
              if (isServerSide && onPaginationChange) {
                onPaginationChange(
                  (externalPageIndex ?? 0) + 1,
                  externalPageSize ?? 10
                );
              } else {
                table.nextPage();
              }
            }}
            size="sm"
            variant="outline"
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
