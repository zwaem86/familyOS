import { CalendarGrid } from "@/features/calendar/calendar-grid";
export default function Page() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ZEIT FÜR ALLES, WAS ZÄHLT.</p>
          <h1>Euer Kalender</h1>
          <p className="subtle">
            Die Woche der ganzen Familie auf einen Blick.
          </p>
        </div>
        <span className="date-pill">Nur Demo-Termine</span>
      </div>
      <CalendarGrid />
    </>
  );
}
