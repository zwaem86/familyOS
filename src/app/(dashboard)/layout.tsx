import { AppShell } from "@/components/layout/app-shell";
import { DemoMealProvider } from "@/features/meal-plan/demo-meal-provider";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoMealProvider>
      <AppShell>{children}</AppShell>
    </DemoMealProvider>
  );
}
