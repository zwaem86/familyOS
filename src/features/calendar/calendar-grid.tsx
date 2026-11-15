"use client";
import { useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  demoEvents,
  demoMembers,
  demoToday,
} from "@/features/dashboard/demo-data";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/features/dashboard/widgets";
import { EmptyState } from "@/components/shared/states";
import {
  formatDate,
  monthDates,
  shiftDate,
  shiftMonth,
  weekDates,
} from "./demo-calendar";
type View = "Tag" | "Woche" | "Monat";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export function CalendarGrid() {
  // Keep SSR controls disabled until React can handle user input.
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [view, setView] = useState<View>("Woche");
  const [date, setDate] = useState(demoToday);
  const [members, setMembers] = useState(demoMembers.map((m) => m.id));
  const dates =
    view === "Tag"
      ? [date]
      : view === "Woche"
        ? weekDates(date)
        : monthDates(date);
  const filtered = demoEvents.filter((e) =>
    e.memberIds.some((id) => members.includes(id)),
  );
  function move(n: number) {
    setDate(
      view === "Monat"
        ? shiftMonth(date, n)
        : shiftDate(date, n * (view === "Woche" ? 7 : 1)),
    );
  }
  return (
    <section className="panel calendar-panel">
      <div className="calendar-toolbar">
        <div className="calendar-date-controls">
          <Button
            disabled={!ready}
            variant="ghost"
            onClick={() => move(-1)}
            aria-label="Vorheriger Zeitraum"
          >
            <ChevronLeft size={18} />
          </Button>
          <h2 aria-live="polite">
            {formatDate(date, { month: "long", year: "numeric" })}
          </h2>
          <Button
            disabled={!ready}
            variant="ghost"
            onClick={() => move(1)}
            aria-label="Nächster Zeitraum"
          >
            <ChevronRight size={18} />
          </Button>
          <Button
            disabled={!ready}
            variant="outline"
            onClick={() => setDate(demoToday)}
          >
            Demo-Heute
          </Button>
        </div>
        <div className="segmented" aria-label="Kalenderansicht">
          {(["Tag", "Woche", "Monat"] as View[]).map((v) => (
            <button
              key={v}
              disabled={!ready}
              aria-pressed={v === view}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
      <fieldset className="member-filters" disabled={!ready}>
        <legend>Familienmitglieder filtern</legend>
        {demoMembers.map((m) => (
          <label key={m.id} className={`member-filter ${m.color}`}>
            <input
              type="checkbox"
              checked={members.includes(m.id)}
              onChange={() =>
                setMembers(
                  members.includes(m.id)
                    ? members.filter((id) => id !== m.id)
                    : [...members, m.id],
                )
              }
            />
            {m.name}
          </label>
        ))}
      </fieldset>
      <div className={`calendar-grid view-${view.toLowerCase()}`}>
        {dates.map((d) => {
          const events = filtered.filter((e) => e.date === d);
          return (
            <section
              className={`calendar-cell ${d === demoToday ? "is-today" : ""} ${d.slice(0, 7) !== date.slice(0, 7) ? "other-month" : ""}`}
              key={d}
              aria-label={formatDate(d, { dateStyle: "full" })}
            >
              <div className="calendar-day">
                <span>{formatDate(d, { weekday: "short" })}</span>
                <strong>{Number(d.slice(-2))}</strong>
                {d === demoToday && <small>Heute</small>}
              </div>
              {events.map((e) =>
                view === "Tag" ? (
                  <EventCard key={e.id} event={e} />
                ) : (
                  <div key={e.id} className={`calendar-event ${e.color}`}>
                    <span>{e.time}</span>
                    <strong>{e.title}</strong>
                    <small>
                      {e.memberIds
                        .map((id) => demoMembers.find((m) => m.id === id)!.name)
                        .join(", ")}
                    </small>
                  </div>
                ),
              )}
              {view === "Tag" && !events.length && (
                <EmptyState
                  title="Zeit für freie Pläne"
                  description="Keine Demo-Termine an diesem Tag."
                />
              )}
            </section>
          );
        })}
      </div>
      {!filtered.some((e) => dates.includes(e.date)) && view !== "Tag" && (
        <EmptyState
          title="Keine Termine in dieser Auswahl"
          description="Wählt andere Profile oder einen anderen Zeitraum."
        />
      )}
      <p className="demo-explanation">
        Fiktiver Kalender · Europe/Berlin · Ansichten und Filter sind bedienbar.
        Terminverwaltung folgt in Phase 3.
      </p>
    </section>
  );
}
