import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

import { BULAN_ROMAWI } from "@/lib/constants";

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatTanggalIndonesia(date: Date | string) {
  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return format(parsedDate, "dd MMMM yyyy", { locale: localeId });
}

export function formatBulanRomawi(month: number) {
  if (month < 1 || month > 12) {
    return "-";
  }

  return BULAN_ROMAWI[month - 1] ?? "-";
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
