"use client";
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { demoMeals } from "./demo-data";
import { normalizeDish } from "./meal-plan";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const MealContext = createContext<{
  meals: Record<string, string>;
  saveMeal: (date: string, value: string) => void;
  ready: boolean;
} | null>(null);
export function DemoMealProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState(demoMeals);
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  function saveMeal(date: string, value: string) {
    const dish = normalizeDish(value);
    setMeals((current) => {
      const next = { ...current };
      if (dish) next[date] = dish;
      else delete next[date];
      return next;
    });
  }
  return (
    <MealContext.Provider value={{ meals, saveMeal, ready }}>
      {children}
    </MealContext.Provider>
  );
}
export function useDemoMeals() {
  const context = useContext(MealContext);
  if (!context) throw new Error("DemoMealProvider fehlt.");
  return context;
}
