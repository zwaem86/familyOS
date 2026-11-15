"use client";
import { useActionState, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import {
  setupAction,
  acceptAction,
  inviteAction,
  childAction,
  type ActionState,
} from "./actions";
const initial: ActionState = { message: "" };
function Feedback({ state }: { state: ActionState }) {
  return (
    <>
      <p role="status">{state.message}</p>
      {state.link && (
        <p className="invite-link">
          <a href={state.link}>{state.link}</a>
        </p>
      )}
      {state.success && !state.link && <Link href="/login">Zur Anmeldung</Link>}
    </>
  );
}
function Field({
  name,
  label,
  type = "text",
  minLength,
  maxLength = 80,
}: {
  name: string;
  label: string;
  type?: string;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={
          type === "password"
            ? "new-password"
            : name === "email"
              ? "email"
              : "off"
        }
      />
    </label>
  );
}
export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <form
      className="account-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage("");
        const form = new FormData(e.currentTarget);
        try {
          const result = await signIn("credentials", {
            email: form.get("email"),
            password: form.get("password"),
            redirect: false,
            callbackUrl: "/",
          });
          if (result?.ok && !result.error) {
            router.push("/");
            router.refresh();
          } else
            setMessage(
              "Anmeldung nicht möglich. Angaben prüfen oder später erneut versuchen.",
            );
        } catch {
          setMessage(
            "Anmeldung derzeit nicht möglich. Bitte erneut versuchen.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        E-Mail
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </label>
      <label>
        Passwort
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      <button disabled={pending}>{pending ? "Anmelden …" : "Anmelden"}</button>
      <p role="status">{message}</p>
      <Link href="/setup">Ersteinrichtung</Link>
    </form>
  );
}
export function SetupForm() {
  const [state, action, pending] = useActionState(setupAction, initial);
  return (
    <form action={action} className="account-form">
      <Field
        name="secret"
        label="Einrichtungsschlüssel"
        type="password"
        minLength={32}
        maxLength={256}
      />
      <Field name="familyName" label="Familienname" />
      <Field name="name" label="Dein Name" />
      <Field name="email" label="E-Mail" type="email" maxLength={254} />
      <Field
        name="password"
        label="Passwort (mindestens 12 Zeichen)"
        type="password"
        minLength={12}
        maxLength={128}
      />
      <button disabled={pending || state.success}>Familie einrichten</button>
      <Feedback state={state} />
    </form>
  );
}
export function AcceptForm() {
  const tokenRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (tokenRef.current)
      tokenRef.current.value = window.location.hash.slice(1);
    window.history.replaceState(null, "", "/invite");
  }, []);
  const [state, action, pending] = useActionState(acceptAction, initial);
  return (
    <form action={action} className="account-form">
      <input type="hidden" name="token" ref={tokenRef} />
      <p>
        Bitte dieselbe E-Mail-Adresse verwenden, für die die Einladung erstellt
        wurde.
      </p>
      <Field name="name" label="Dein Name" />
      <Field name="email" label="E-Mail" type="email" maxLength={254} />
      <Field
        name="password"
        label="Passwort (mindestens 12 Zeichen)"
        type="password"
        minLength={12}
        maxLength={128}
      />
      <button disabled={pending || state.success}>Einladung annehmen</button>
      <Feedback state={state} />
    </form>
  );
}
export function InviteForm() {
  const [state, action, pending] = useActionState(inviteAction, initial);
  return (
    <form action={action} className="account-form">
      <Field
        name="email"
        label="E-Mail des zweiten Erwachsenen"
        type="email"
        maxLength={254}
      />
      <button disabled={pending}>Einladung erstellen</button>
      <Feedback state={state} />
    </form>
  );
}
export function ChildForm({
  member,
}: {
  member?: { id: string; name: string; color: string };
}) {
  const [state, action, pending] = useActionState(childAction, initial);
  return (
    <form action={action} className="account-form">
      {member && <input name="id" type="hidden" value={member.id} />}
      <label>
        Name des Kindes
        <input
          name="name"
          defaultValue={member?.name}
          required
          maxLength={80}
        />
      </label>
      <label>
        Profilfarbe
        <select name="color" defaultValue={member?.color ?? "green"}>
          <option value="blue">Blau</option>
          <option value="pink">Rosa</option>
          <option value="green">Grün</option>
          <option value="purple">Violett</option>
        </select>
      </label>
      <button disabled={pending}>
        {member ? "Profil speichern" : "Kinderprofil anlegen"}
      </button>
      <p role="status">{state.message}</p>
    </form>
  );
}
export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })}>Abmelden</button>
  );
}
