import { formatDate, weekDates } from "../calendar/demo-calendar";
export function mealWeekLabel(date: string) {
  const days = weekDates(date);
  return `${formatDate(days[0], { day: "numeric", month: "long", year: "numeric" })} – ${formatDate(days[6], { day: "numeric", month: "long", year: "numeric" })}`;
}
export function normalizeDish(value: string) {
  const dish = value.trim();
  if (dish.length > 120)
    throw new Error("Bitte höchstens 120 Zeichen für das Gericht eingeben.");
  return dish;
}
