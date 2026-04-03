import { Clock3 } from "lucide-react";
import { formatUpdatedAt } from "@/lib/utils/format";

interface DataFreshnessProps {
  fetchedAt: string;
  label?: string;
}

export function DataFreshness({ fetchedAt, label = "Updated" }: DataFreshnessProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs text-text-secondary">
      <Clock3 className="h-3.5 w-3.5 text-amber" />
      <span>{label} {formatUpdatedAt(fetchedAt)}</span>
    </div>
  );
}
