import { AppShell } from "@/components/layout/app-shell";
import { DemoMealProvider } from "@/features/meal-plan/demo-meal-provider";
import { readFamily } from "@/features/family/server/service";
import { requireSession } from "@/lib/auth/session";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const family = await readFamily(await requireSession());
  return (
    <DemoMealProvider>
      <AppShell familyName={family.name}>{children}</AppShell>
    </DemoMealProvider>
  );
}
