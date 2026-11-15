"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertOrigin, authEnvironment } from "@/lib/auth/config";
import { requireSession } from "@/lib/auth/session";
import {
  setup,
  acceptInvitation,
  createInvitation,
  createChild,
  updateChild,
} from "./server/service";
export type ActionState = { message: string; success?: boolean; link?: string };
async function checkOrigin() {
  assertOrigin((await headers()).get("origin"));
}
const failure = (): ActionState => ({
  message: "Aktion nicht möglich. Angaben, Berechtigung oder Wartezeit prüfen.",
});
export async function setupAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await checkOrigin();
    await setup(Object.fromEntries(form));
    return {
      message: "Familie angelegt. Du kannst dich jetzt anmelden.",
      success: true,
    };
  } catch {
    return failure();
  }
}
export async function acceptAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    await checkOrigin();
    await acceptInvitation(Object.fromEntries(form));
    return {
      message: "Konto angelegt. Du kannst dich jetzt anmelden.",
      success: true,
    };
  } catch {
    return failure();
  }
}
export async function inviteAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await checkOrigin();
  const p = await requireSession();
  try {
    const token = await createInvitation(p, form.get("email"));
    return {
      message:
        "Einladung erstellt. Link vertraulich an die eingeladene Person weitergeben. Gültig für 24 Stunden; frühere Links sind ungültig.",
      success: true,
      link: `${authEnvironment().origin}/invite#${token}`,
    };
  } catch {
    return failure();
  }
}
export async function childAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await checkOrigin();
  const p = await requireSession();
  try {
    const id = form.get("id");
    if (id) await updateChild(p, z.uuid().parse(id), Object.fromEntries(form));
    else await createChild(p, Object.fromEntries(form));
    revalidatePath("/settings");
    return { message: "Kinderprofil gespeichert.", success: true };
  } catch {
    return failure();
  }
}
