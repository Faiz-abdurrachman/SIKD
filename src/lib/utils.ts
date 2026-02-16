import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, dateFormat = "dd MMMM yyyy") {
  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return format(parsedDate, dateFormat, { locale: localeId });
}

export function formatNIK(nik: string) {
  return nik.replace(/(.{4})/g, "$1.").replace(/\.$/, "");
}

export function formatNoKK(noKK: string) {
  return noKK.replace(/(.{4})/g, "$1.").replace(/\.$/, "");
}

export function calculateAge(tanggalLahir: Date | string) {
  const birthDate = typeof tanggalLahir === "string" ? new Date(tanggalLahir) : tanggalLahir;

  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();

  const monthDiff = now.getMonth() - birthDate.getMonth();
  const hasNotHadBirthday = monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate());

  if (hasNotHadBirthday) {
    age -= 1;
  }

  return age;
}

export function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
