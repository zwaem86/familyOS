import { Suspense } from "react";
import { LoadingState } from "@/components/shared/states";
import { MealPlanEditor } from "@/features/meal-plan/meal-plan-editor";
export default function MealPlanPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WENIGER GRÜBELN. MEHR GENIESSEN.</p>
          <h1>Euer Essensplan</h1>
          <p className="subtle">Was kommt abends auf den Tisch?</p>
        </div>
      </div>
      <Suspense fallback={<LoadingState />}>
        <MealPlanEditor />
      </Suspense>
    </>
  );
}
