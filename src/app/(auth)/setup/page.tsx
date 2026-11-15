import { SetupForm } from "@/features/family/forms";
import { db } from "@/lib/db/client";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (await db().bootstrap.findUnique({ where: { id: 1 } }))
    return (
      <>
        <h1>Einrichtung abgeschlossen</h1>
        <p>Die Ersteinrichtung ist geschlossen.</p>
        <a href="/login">Zur Anmeldung</a>
      </>
    );
  return (
    <>
      <h1>Familie einrichten</h1>
      <p>
        Nur für die erste Einrichtung. Du benötigst den vertraulichen
        Einrichtungsschlüssel des Betreibers.
      </p>
      <SetupForm />
    </>
  );
}
