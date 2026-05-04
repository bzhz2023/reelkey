export function formatRelativeTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (absMs < minute) {
    return rtf.format(Math.round(diffMs / 1000), "second");
  }
  if (absMs < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }
  if (absMs < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }
  if (absMs < month) {
    return rtf.format(Math.round(diffMs / day), "day");
  }
  if (absMs < year) {
    return rtf.format(Math.round(diffMs / month), "month");
  }
  return rtf.format(Math.round(diffMs / year), "year");
}
