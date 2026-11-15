import { ShoppingWidget } from "@/features/dashboard/widgets";
export default function Page() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ALLES DABEI FÜR EURE WOCHE.</p>
          <h1>Einkauf</h1>
          <p className="subtle">
            Eine gemeinsame Liste, ein Kopf weniger voll.
          </p>
        </div>
      </div>
      <div className="narrow">
        <ShoppingWidget full />
        <p className="demo-explanation">
          Demo: Abhaken und Hinzufügen funktionieren lokal. Beim Neuladen werden
          alle Änderungen zurückgesetzt.
        </p>
      </div>
    </>
  );
}
