import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(
  from?: string | Date | null,
  to?: string | Date | null,
): string {
  if (!from) return "-";
  const start = from instanceof Date ? from : new Date(String(from));
  const end = to ? (to instanceof Date ? to : new Date(String(to))) : new Date();
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";

  let delta = Math.max(0, end.getTime() - start.getTime()); // milliseconds

  const days = Math.floor(delta / (24 * 60 * 60 * 1000));
  delta -= days * 24 * 60 * 60 * 1000;
  const hours = Math.floor(delta / (60 * 60 * 1000));
  delta -= hours * 60 * 60 * 1000;
  const minutes = Math.floor(delta / (60 * 1000));
  delta -= minutes * 60 * 1000;
  const seconds = Math.floor(delta / 1000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && parts.length < 2) parts.push(`${minutes}m`); // limit detail
  if (parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}
