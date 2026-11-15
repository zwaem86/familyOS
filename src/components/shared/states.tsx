import { CircleAlert, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
export function EmptyState({
  title = "Alles im Blick",
  description = "Hier gibt es gerade nichts zu tun.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="state">
      <Inbox aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function LoadingState() {
  return (
    <div role="status" className="state">
      <span className="skeleton" />
      <span className="skeleton" />
      Demo-Ansicht wird geladen …
    </div>
  );
}
export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div className="state" role="alert">
      <CircleAlert aria-hidden="true" />
      <h3>Das hat gerade nicht geklappt</h3>
      <p>Die Demo-Daten konnten nicht angezeigt werden.</p>
      <Button variant="outline" onClick={retry}>
        Erneut versuchen
      </Button>
    </div>
  );
}
