"use client";
import Link from "next/link";
import { ArrowRight, Utensils } from "lucide-react";
import { demoToday } from "@/features/dashboard/demo-data";
import { formatDate, weekDates } from "@/features/calendar/demo-calendar";
import { useDemoMeals } from "./demo-meal-provider";
import { mealWeekLabel } from "./meal-plan";
export function MealPlanWidget() {
  const { meals } = useDemoMeals();
  return (
    <section className="panel meal-widget" aria-labelledby="meal-widget-title">
      <div className="meal-heading">
        <div>
          <p className="eyebrow">GEMEINSAM AM TISCH</p>
          <h2 id="meal-widget-title">
            <Utensils size={19} aria-hidden="true" />
            Unser Essensplan
          </h2>
          <p className="subtle">{mealWeekLabel(demoToday)}</p>
        </div>
        <Link className="meal-edit-link" href="/meal-plan">
          Essensplan bearbeiten
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <p className="meal-tonight">
        <strong>Heute Abend:</strong> {meals[demoToday] || "Noch offen"}
      </p>
      <ol className="meal-week">
        {weekDates(demoToday).map((date) => (
          <li className={date === demoToday ? "meal-today" : ""} key={date}>
            <div className="meal-day">
              <span>{formatDate(date, { weekday: "long" })}</span>
              <span>
                {formatDate(date, { day: "2-digit", month: "2-digit" })}
                {date === demoToday && <strong> · Heute</strong>}
              </span>
            </div>
            <p className={!meals[date] ? "meal-open" : ""}>
              {meals[date] || "Noch offen"}
            </p>
          </li>
        ))}
      </ol>
      <div className="meal-widget-footer">
        <span>Fiktive Demo · Änderungen nur bis zum Neuladen</span>
        <Link className="meal-edit-link" href="/meal-plan?week=next">
          Nächste Woche planen
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
