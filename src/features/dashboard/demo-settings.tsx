"use client";
import { useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { demoMembers } from "./demo-data";
import { MemberAvatar } from "@/components/shared/member-avatar";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/states";
import { Button } from "@/components/ui/button";
export function DemoSettings() {
  const [state, setState] = useState("success");
  return (
    <div className="settings-grid">
      <section className="panel">
        <h2>
          <Users size={20} aria-hidden="true" />
          Eure Demo-Familie
        </h2>
        <p className="subtle">Vier fiktive Profile, ein gemeinsamer Alltag.</p>
        {demoMembers.map((m) => (
          <div className="profile-row" key={m.id}>
            <MemberAvatar member={m} />
            <div>
              <strong>{m.name}</strong>
              <small>{m.label}</small>
            </div>
            <span className="profile-label">Demo</span>
          </div>
        ))}
      </section>
      <div className="widget-column">
        <section className="panel">
          <h2>
            <ShieldCheck size={20} aria-hidden="true" />
            Transparent von Anfang an
          </h2>
          <p>
            Dies ist ein öffentlicher UI-Prototyp ohne Anmeldung und Datenbank.
            Bitte keine echten Familieninformationen eingeben.
          </p>
          <dl className="settings-details">
            <div>
              <dt>Sprache</dt>
              <dd>Deutsch</dd>
            </div>
            <div>
              <dt>Zeitzone</dt>
              <dd>Europe/Berlin</dd>
            </div>
            <div>
              <dt>Speicherung</dt>
              <dd>Nur flüchtiger Demo-Zustand</dd>
            </div>
            <div>
              <dt>Externe Dienste</dt>
              <dd>Keine</dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <h2>UI-Zustände ausprobieren</h2>
          <p className="subtle">Vorschau gemeinsamer Komponenten.</p>
          <div className="state-controls">
            {[
              ["success", "Erfolg"],
              ["loading", "Laden"],
              ["empty", "Leer"],
              ["error", "Fehler"],
            ].map(([value, label]) => (
              <Button
                variant="outline"
                key={value}
                aria-pressed={state === value}
                onClick={() => setState(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          {state === "loading" ? (
            <LoadingState />
          ) : state === "empty" ? (
            <EmptyState />
          ) : state === "error" ? (
            <ErrorState retry={() => setState("success")} />
          ) : (
            <p role="status" className="success-message">
              Alles bereit. Die Demo wurde erfolgreich geladen.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
