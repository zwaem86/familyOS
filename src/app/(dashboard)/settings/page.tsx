import { DemoSettings } from "@/features/dashboard/demo-settings";
export default function Page() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EUER ZUHAUSE. EUER ÜBERBLICK.</p>
          <h1>Einstellungen</h1>
          <p className="subtle">Profile und Grundlagen der UI-Demo.</p>
        </div>
      </div>
      <DemoSettings />
    </>
  );
}
