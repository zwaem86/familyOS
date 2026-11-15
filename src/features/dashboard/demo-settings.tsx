"use client";
import { useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/states";
import { Button } from "@/components/ui/button";
export function DemoStatePreview() {
  const [state, setState] = useState("success");
  return (
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
  );
}
