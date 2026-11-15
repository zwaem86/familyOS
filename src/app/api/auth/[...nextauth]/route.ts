import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { assertOrigin } from "@/lib/auth/config";
export const runtime = "nodejs";
type Context = { params: Promise<{ nextauth: string[] }> };
async function handler(request: NextRequest, context: Context) {
  if (request.method === "POST") {
    try {
      assertOrigin(request.headers.get("origin"));
    } catch {
      return new Response(null, { status: 403 });
    }
  }
  const params = await context.params;
  return NextAuth(authOptions())(request, { params });
}
export { handler as GET, handler as POST };
