"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { demoToday } from "@/features/dashboard/demo-data";
import {
  formatDate,
  shiftDate,
  weekDates,
} from "@/features/calendar/demo-calendar";
import { useDemoMeals } from "./demo-meal-provider";
import { mealWeekLabel, normalizeDish } from "./meal-plan";
export function MealPlanEditor() {
  const query = useSearchParams();
  const initialWeek = weekDates(
    shiftDate(demoToday, query.get("week") === "next" ? 7 : 0),
  )[0];
  return <WeekEditor key={initialWeek} initialWeek={initialWeek} />;
}
function WeekEditor({ initialWeek }: { initialWeek: string }) {
  const { meals, saveMeal, ready } = useDemoMeals();
  const [week, setWeek] = useState(initialWeek);
  function draftsFor(date: string) {
    return Object.fromEntries(
      weekDates(date).map((day) => [day, meals[day] || ""]),
    );
  }
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    draftsFor(initialWeek),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const dates = weekDates(week);
  const dirty = dates.some((day) => drafts[day] !== (meals[day] || ""));
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function allowDiscard() {
    return (
      !dirty ||
      window.confirm(
        "Ungespeicherte Änderungen verwerfen und die Ansicht wechseln?",
      )
    );
  }
  function changeWeek(date: string) {
    const monday = weekDates(date)[0];
    if (monday === week || !allowDiscard()) return;
    setWeek(monday);
    setDrafts(draftsFor(monday));
    setErrors({});
    setMessage("");
  }
  return (
    <section className="panel" aria-label="Essensplan bearbeiten">
      <fieldset className="meal-editor" disabled={!ready}>
        <legend className="sr-only">Abendessen bearbeiten</legend>
        <div className="meal-editor-toolbar">
          <div className="meal-week-navigation">
            <Button
              variant="outline"
              onClick={() => changeWeek(shiftDate(week, -7))}
              aria-label="Vorherige Woche"
            >
              <ChevronLeft size={18} />
            </Button>
            <h2 aria-live="polite">{mealWeekLabel(week)}</h2>
            <Button
              variant="outline"
              onClick={() => changeWeek(shiftDate(week, 7))}
              aria-label="Folgende Woche"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          <div className="state-controls">
            <Button
              variant="outline"
              aria-pressed={week === weekDates(demoToday)[0]}
              onClick={() => changeWeek(demoToday)}
            >
              Diese Woche
            </Button>
            <Button
              variant="outline"
              aria-pressed={week === weekDates(shiftDate(demoToday, 7))[0]}
              onClick={() => changeWeek(shiftDate(demoToday, 7))}
            >
              Nächste Woche
            </Button>
          </div>
        </div>
        <p className="demo-explanation">
          Fiktive Demo · Abendessen für Montag bis Sonntag. Jeden Tag einzeln
          speichern; leeres Feld speichern entfernt das Gericht. Änderungen
          bleiben nur bis zum Neuladen.
        </p>
        {!dates.some((day) => meals[day]) && (
          <EmptyState
            title="Noch eine Woche voller Möglichkeiten"
            description="Noch kein Abendessen geplant. Tragt eure ersten Gerichte ein."
          />
        )}
        <div className="meal-editor-days">
          {dates.map((date) => {
            const dayLabel = formatDate(date, { dateStyle: "full" });
            const inputId = `dish-${date}`;
            return (
              <form
                aria-label={dayLabel}
                className={`meal-editor-row ${date === demoToday ? "meal-today" : ""}`}
                key={date}
                onSubmit={(event) => {
                  event.preventDefault();
                  try {
                    const dish = normalizeDish(drafts[date]);
                    saveMeal(date, dish);
                    setDrafts((current) => ({ ...current, [date]: dish }));
                    setErrors((current) => ({ ...current, [date]: "" }));
                    setMessage(
                      `${formatDate(date, { weekday: "long" })}: ${dish ? "Gericht gespeichert" : "Gericht entfernt"}. Nur in dieser Demo-Sitzung.`,
                    );
                  } catch (error) {
                    setErrors((current) => ({
                      ...current,
                      [date]:
                        error instanceof Error
                          ? error.message
                          : "Speichern fehlgeschlagen. Bitte erneut versuchen.",
                    }));
                    setMessage("");
                  }
                }}
              >
                <div className="meal-editor-date">
                  <strong>
                    {formatDate(date, { weekday: "long" })}
                    {date === demoToday && <span> · Heute</span>}
                  </strong>
                  <span>
                    {formatDate(date, { day: "numeric", month: "long" })}
                  </span>
                </div>
                <div className="meal-input">
                  <label className="sr-only" htmlFor={inputId}>
                    Abendessen am {dayLabel}
                  </label>
                  <input
                    id={inputId}
                    value={drafts[date]}
                    maxLength={500}
                    disabled={!ready}
                    placeholder="Noch offen"
                    aria-invalid={!!errors[date]}
                    aria-describedby={
                      errors[date] ? `error-${date}` : undefined
                    }
                    onChange={(event) => {
                      setDrafts((current) => ({
                        ...current,
                        [date]: event.target.value,
                      }));
                      setErrors((current) => ({ ...current, [date]: "" }));
                      setMessage("");
                    }}
                  />
                  {errors[date] && (
                    <p id={`error-${date}`} role="alert" className="meal-error">
                      {errors[date]}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!ready || drafts[date] === (meals[date] || "")}
                >
                  Speichern<span className="sr-only">: {dayLabel}</span>
                </Button>
              </form>
            );
          })}
        </div>
      </fieldset>
      <p role="status" className="meal-save-status">
        {message ||
          (dirty
            ? "Ungespeicherte Änderungen vorhanden."
            : "Alle angezeigten Eingaben entsprechen dem Demo-Stand.")}
      </p>
      <Link
        href="/"
        className="meal-edit-link"
        onClick={(event) => {
          if (!allowDiscard()) event.preventDefault();
        }}
      >
        Zur Übersicht
      </Link>
    </section>
  );
}
