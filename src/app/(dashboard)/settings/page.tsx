import { DemoStatePreview } from "@/features/dashboard/demo-settings";
import { requireSession } from "@/lib/auth/session";
import { readFamily, requireMember } from "@/features/family/server/service";
import { ChildForm, InviteForm, LogoutButton } from "@/features/family/forms";
export default async function Page() {
  const p = await requireSession();
  const family = await readFamily(p);
  const member = await requireMember(p);
  const children = family.members.filter((m) => m.type === "CHILD");
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Einstellungen</h1>
          <p className="subtle">
            {family.name} · {family.timezone}
          </p>
        </div>
        <LogoutButton />
      </div>
      <section className="panel">
        <h2>Familienprofile</h2>
        <ul>
          {family.members.map((m) => (
            <li key={m.id}>
              {m.name} ·{" "}
              {m.type === "CHILD"
                ? "Kind · ohne Login"
                : m.role === "ADMIN"
                  ? "Erwachsen · Admin"
                  : "Erwachsen · Mitglied"}
            </li>
          ))}
        </ul>
      </section>
      {member.role === "ADMIN" && (
        <div className="family-settings">
          {family.members.filter((m) => m.type === "ADULT").length < 2 && (
            <section className="panel">
              <h2>Zweiten Erwachsenen einladen</h2>
              <InviteForm />
            </section>
          )}
          <section className="panel">
            <h2>Kinderprofile</h2>
            {children.map((m) => (
              <ChildForm member={m} key={m.id} />
            ))}
            {children.length < 2 && <ChildForm />}
            <p>Kinder erhalten keinen eigenen Zugang.</p>
          </section>
        </div>
      )}
      <DemoStatePreview />
    </>
  );
}
