import {
  GreetingWidget,
  UpcomingEventsWidget,
  TasksWidget,
  ShoppingWidget,
  WeatherWidget,
  QuickActions,
} from "@/features/dashboard/widgets";
import { MealPlanWidget } from "@/features/meal-plan/meal-plan-widget";
export default function DashboardPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">GUT ORGANISIERT. GANZ ENTSPANNT.</p>
          <h2 className="page-title">Eure Übersicht</h2>
        </div>
        <span className="date-pill">
          KW 47 <span>·</span> Eine neue Woche
        </span>
      </div>
      <GreetingWidget />
      <MealPlanWidget />
      <div className="dashboard-grid">
        <UpcomingEventsWidget />
        <div className="widget-column">
          <TasksWidget />
          <WeatherWidget />
        </div>
        <div className="widget-column">
          <ShoppingWidget />
          <QuickActions />
        </div>
      </div>
    </>
  );
}
