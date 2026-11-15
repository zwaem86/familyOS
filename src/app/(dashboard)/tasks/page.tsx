import { TasksWidget } from "@/features/dashboard/widgets";
export default function Page() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">KLEINE AUFGABEN. GROSSES TEAM.</p>
          <h1>Aufgaben</h1>
          <p className="subtle">Gemeinsam den Alltag leichter machen.</p>
        </div>
      </div>
      <div className="narrow">
        <TasksWidget full />
        <p className="demo-explanation">
          Demo: Abhaken und Hinzufügen funktionieren lokal. Beim Neuladen werden
          alle Änderungen zurückgesetzt.
        </p>
      </div>
    </>
  );
}
