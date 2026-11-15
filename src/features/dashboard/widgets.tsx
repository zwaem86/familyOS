"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  CloudSun,
  MapPin,
  Plus,
  ShoppingBasket,
  Sun,
} from "lucide-react";
import { demoEvents, demoMembers, demoShopping, demoTasks } from "./demo-data";
import type { DemoEvent } from "@/features/calendar/types";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
export function SectionHeading({
  title,
  href,
  label = "Alle ansehen",
  icon,
}: {
  title: string;
  href?: string;
  label?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>
        {icon}
        {title}
      </h2>
      {href && (
        <Link href={href}>
          {label}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
export function GreetingWidget() {
  return (
    <section className="greeting">
      <div>
        <p className="eyebrow">
          <Sun size={16} aria-hidden="true" /> MONTAG, 16. NOVEMBER
        </p>
        <h1>
          Ein guter Tag beginnt
          <br />
          mit einem guten Überblick.
        </h1>
        <p>Hallo, Familie Sonnenschein. Schön, dass ihr da seid.</p>
        <div className="greeting-chips">
          <span>
            <CalendarDays size={15} aria-hidden="true" />3 Termine heute
          </span>
          <span>
            <CheckCheck size={15} aria-hidden="true" />3 offene Aufgaben
          </span>
        </div>
      </div>
      <div className="greeting-art" aria-hidden="true">
        <div className="art-sun" />
        <div className="art-hill back" />
        <div className="art-house">
          <div className="roof" />
          <div className="window" />
          <div className="door" />
        </div>
        <div className="art-hill front" />
        <div className="art-tree" />
      </div>
    </section>
  );
}
export function EventCard({ event }: { event: DemoEvent }) {
  return (
    <article className={`event-card ${event.color}`}>
      <div className="event-time">
        <strong>{event.time}</strong>
        <span>{event.end}</span>
      </div>
      <div className="event-info">
        <h3>{event.title}</h3>
        <p>
          <MapPin size={13} aria-hidden="true" />
          {event.location}
        </p>
        <div className="event-members">
          {event.memberIds.map((id) => {
            const member = demoMembers.find((m) => m.id === id)!;
            return (
              <span key={id}>
                <span className={`member-dot ${member.color}`} />
                {member.name}
              </span>
            );
          })}
        </div>
      </div>
    </article>
  );
}
export function UpcomingEventsWidget() {
  return (
    <section className="panel events-panel">
      <SectionHeading
        title="Heute steht an"
        href="/calendar"
        label="Zum Kalender"
        icon={<CalendarDays size={19} aria-hidden="true" />}
      />
      <div className="day-caption">
        <span className="day-number">16</span>
        <span>
          <strong>Montag</strong>
          <small>November 2026</small>
        </span>
        <span className="today-label">Heute</span>
      </div>
      <div className="event-list">
        {demoEvents.slice(0, 3).map((e) => (
          <EventCard event={e} key={e.id} />
        ))}
      </div>
      <p className="panel-footnote">
        Ein bisschen Planung. Viel Platz fürs Leben.
      </p>
    </section>
  );
}
export function TasksWidget({ full = false }: { full?: boolean }) {
  const [tasks, setTasks] = useState(demoTasks);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const open = tasks.filter((t) => !t.done).length;
  return (
    <section className="panel">
      <SectionHeading
        title={full ? "Eure Aufgaben" : "Noch zu erledigen"}
        href={full ? undefined : "/tasks"}
        icon={<CheckCheck size={19} aria-hidden="true" />}
      />
      <p className="subtle">{open} offen · Gemeinsam geht’s leichter.</p>
      <div className="task-list">
        {tasks.length ? (
          tasks.map((task) => (
            <label
              className={`check-row ${task.done ? "done" : ""}`}
              key={task.id}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => {
                  setTasks(
                    tasks.map((t) =>
                      t.id === task.id ? { ...t, done: !t.done } : t,
                    ),
                  );
                  setMessage("Demo-Aufgabe aktualisiert.");
                }}
              />
              <span className="check-content">
                <strong>{task.title}</strong>
                <small>{task.note}</small>
              </span>
              <MemberAvatar
                member={demoMembers.find((m) => m.id === task.memberId)!}
                small
              />
            </label>
          ))
        ) : (
          <EmptyState title="Keine Aufgaben" />
        )}
      </div>
      {full && (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            setTasks([
              ...tasks,
              {
                id: crypto.randomUUID(),
                title: title.trim(),
                memberId: "anna",
                done: false,
                note: "Demo · neu hinzugefügt",
              },
            ]);
            setTitle("");
            setMessage(
              "Demo-Aufgabe hinzugefügt. Nicht dauerhaft gespeichert.",
            );
          }}
        >
          <label className="sr-only" htmlFor="task-title">
            Neue Demo-Aufgabe
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Was ist zu tun?"
            required
            maxLength={120}
          />
          <Button type="submit">
            <Plus size={17} aria-hidden="true" />
            Hinzufügen
          </Button>
        </form>
      )}
      <p className="sr-only" role="status">
        {message}
      </p>
    </section>
  );
}
export function ShoppingWidget({ full = false }: { full?: boolean }) {
  const [items, setItems] = useState(demoShopping);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  return (
    <section className="panel">
      <SectionHeading
        title="Unsere Einkaufsliste"
        href={full ? undefined : "/shopping"}
        label="Zur Liste"
        icon={<ShoppingBasket size={19} aria-hidden="true" />}
      />
      <p className="subtle">
        {items.filter((i) => !i.checked).length} Dinge für den nächsten Einkauf
      </p>
      <div className="shopping-list">
        {items.length ? (
          items.map((item) => (
            <label
              className={`check-row ${item.checked ? "done" : ""}`}
              key={item.id}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => {
                  setItems(
                    items.map((i) =>
                      i.id === item.id ? { ...i, checked: !i.checked } : i,
                    ),
                  );
                  setMessage("Demo-Einkaufsliste aktualisiert.");
                }}
              />
              <strong className="check-content">{item.name}</strong>
              <span className="quantity">{item.quantity}</span>
            </label>
          ))
        ) : (
          <EmptyState title="Die Liste ist leer" />
        )}
      </div>
      {full ? (
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setItems([
              ...items,
              {
                id: crypto.randomUUID(),
                name: name.trim(),
                quantity: "1 Stück",
                checked: false,
              },
            ]);
            setName("");
            setMessage(
              "Demo-Artikel hinzugefügt. Nicht dauerhaft gespeichert.",
            );
          }}
        >
          <label htmlFor="shopping-name" className="sr-only">
            Neuer Demo-Artikel
          </label>
          <input
            id="shopping-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Was fehlt noch?"
            required
            maxLength={120}
          />
          <Button type="submit">
            <Plus size={17} aria-hidden="true" />
            Hinzufügen
          </Button>
        </form>
      ) : (
        <Link className="list-link" href="/shopping">
          <Plus size={16} aria-hidden="true" />
          Etwas hinzufügen
        </Link>
      )}
      <p role="status" className="sr-only">
        {message}
      </p>
    </section>
  );
}
export function WeatherWidget() {
  return (
    <section className="weather">
      <div>
        <p className="eyebrow">DRAUSSEN WARTET DER HERBST</p>
        <div className="weather-temperature">
          12°
          <CloudSun size={62} strokeWidth={1.4} aria-hidden="true" />
        </div>
        <strong>Wolkig mit kleinen Lichtblicken</strong>
        <p>Jacke einpacken, frische Luft genießen.</p>
        <small>Fiktives Wetter · keine Standortabfrage</small>
      </div>
    </section>
  );
}
export function QuickActions() {
  return (
    <section className="panel quick-actions">
      <SectionHeading title="Einfach schnell erledigt" />
      <div>
        <Link href="/calendar">
          <CalendarDays aria-hidden="true" />
          <span>Termine ansehen</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/tasks">
          <Check aria-hidden="true" />
          <span>Aufgabe hinzufügen</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link href="/shopping">
          <ShoppingBasket aria-hidden="true" />
          <span>Einkauf ergänzen</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
