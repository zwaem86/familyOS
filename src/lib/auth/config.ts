export function authEnvironment() {
  const url = new URL(process.env.NEXTAUTH_URL ?? "http://invalid.invalid");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    !process.env.NEXTAUTH_URL ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (!local && url.protocol !== "https:") ||
    !["http:", "https:"].includes(url.protocol)
  ) {
    throw new Error(
      "NEXTAUTH_URL muss eine kanonische HTTPS-Origin sein (HTTP nur auf Loopback)",
    );
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("AUTH_SECRET benötigt mindestens 32 Zeichen");
  return { origin: url.origin, secure: url.protocol === "https:", secret };
}
export function assertOrigin(origin: string | null) {
  if (origin !== authEnvironment().origin)
    throw new Error("Unzulässiger Ursprung");
}
