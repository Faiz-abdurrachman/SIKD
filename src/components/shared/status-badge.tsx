import { Badge } from "@/components/ui/badge";
import { STATUS_KEPENDUDUKAN_COLOR, STATUS_SURAT_COLOR } from "@/lib/constants";
import { formatEnumLabel } from "@/lib/format";

type StatusBadgeProps = {
  status: string;
  type: "surat" | "kependudukan";
};

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const colorClass =
    type === "surat"
      ? STATUS_SURAT_COLOR[status as keyof typeof STATUS_SURAT_COLOR]
      : STATUS_KEPENDUDUKAN_COLOR[status as keyof typeof STATUS_KEPENDUDUKAN_COLOR];

  return (
    <Badge className={colorClass ?? "bg-slate-100 text-slate-700"} variant="secondary">
      {formatEnumLabel(status)}
    </Badge>
  );
}
