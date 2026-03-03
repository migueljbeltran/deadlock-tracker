/**
 * Format a duration in seconds to a human-readable string.
 * e.g. 1832 → "30m 32s"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }

  return `${mins}m ${secs}s`;
}

/**
 * Format a date/timestamp into a relative time string.
 * e.g. "2h ago", "3d ago", "just now"
 */
export function formatTimeAgo(input: string | number): string {
  const date = typeof input === "number" ? new Date(input * 1000) : new Date(input);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a number with comma separators.
 * e.g. 1234567 → "1,234,567"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
