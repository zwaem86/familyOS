export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function weekDates(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const monday = shiftDate(date, -((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}
export function monthDates(date: string) {
  const first = `${date.slice(0, 7)}-01`;
  const start = weekDates(first)[0];
  const last = new Date(
    Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)), 0),
  ).getUTCDate();
  const offset = weekDates(first).indexOf(first);
  return Array.from({ length: Math.ceil((last + offset) / 7) * 7 }, (_, i) =>
    shiftDate(start, i),
  );
}
export function shiftMonth(date: string, direction: number) {
  const d = new Date(`${date}T12:00:00Z`);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + direction, 1, 12),
  )
    .toISOString()
    .slice(0, 10);
}
export function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("de-DE", {
    ...options,
    timeZone: "Europe/Berlin",
  }).format(new Date(`${date}T12:00:00Z`));
}
