import { SigilLoader } from "@/components/ui/SigilLoader";

const SKELETON_ROWS = 15;
const NAME_WIDTHS = ["w-28", "w-36", "w-24", "w-32", "w-20", "w-30", "w-26", "w-34"];

export function LeaderboardTableSkeleton() {
  return (
    <div>
      <div className="overflow-x-auto rounded-lg glass-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-amber bg-gradient-to-r from-amber/15 via-amber/5 to-transparent text-left uppercase tracking-[0.05em] text-xs text-amber">
              <th className="px-3 py-2 w-16 text-center">#</th>
              <th className="px-3 py-2">Player</th>
              <th className="px-3 py-2 text-center">Rank</th>
              <th className="hidden px-3 py-2 sm:table-cell">Top Heroes</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <tr
                key={i}
                className="border-b border-border-subtle"
              >
                <td className="px-3 py-2 text-center">
                  <div className="mx-auto h-4 w-6 rounded bg-surface-elevated animate-pulse" />
                </td>
                <td className="px-3 py-2">
                  <div
                    className={`h-4 rounded bg-surface-elevated animate-pulse ${NAME_WIDTHS[i % NAME_WIDTHS.length]}`}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="mx-auto h-7 w-7 rounded bg-surface-elevated animate-pulse" />
                </td>
                <td className="hidden px-3 py-2 sm:table-cell">
                  <div className="flex gap-1">
                    <div className="h-7 w-7 rounded bg-surface-elevated animate-pulse" />
                    <div className="h-7 w-7 rounded bg-surface-elevated animate-pulse" />
                    <div className="h-7 w-7 rounded bg-surface-elevated animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <SigilLoader size="sm" />
        <p className="font-heading text-sm text-text-secondary">
          Consulting the ranked archives...
        </p>
      </div>
    </div>
  );
}
