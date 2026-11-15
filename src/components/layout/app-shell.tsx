"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckCheck,
  House,
  Settings,
  ShoppingBasket,
  Sprout,
  ArrowUpRight,
} from "lucide-react";
import { demoMembers } from "@/features/dashboard/demo-data";
import { MemberAvatar } from "@/components/shared/member-avatar";
const navigation = [
  { href: "/", label: "Übersicht", icon: House },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/tasks", label: "Aufgaben", icon: CheckCheck },
  { href: "/shopping", label: "Einkauf", icon: ShoppingBasket },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Zum Inhalt springen
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="FamilyOS Übersicht">
          <span className="brand-icon">
            <Sprout aria-hidden="true" />
          </span>
          family<span className="brand-os">OS</span>
        </Link>
        <div className="family-label">UNSER FAMILIENALLTAG</div>
        <nav aria-label="Hauptnavigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${path === href ? "active" : ""}`}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon aria-hidden="true" size={20} />
              {label}
              {path === href && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="home-note">
            <Sprout aria-hidden="true" />
            <strong>Mehr Zeit füreinander.</strong>
            <p>Die kleinen Dinge gut organisiert.</p>
          </div>
          <Link href="/settings" className="family-link">
            <span className="avatar blue">F</span>
            <span>
              <strong>Familie Sonnenschein</strong>
              <small>4 fiktive Profile</small>
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="topbar-title">
            Unser Zuhause<span className="topbar-divider">/</span>
            <span>{navigation.find((n) => n.href === path)?.label}</span>
          </span>
          <div className="topbar-right">
            <span className="demo-badge">UI-DEMO</span>
            <div className="avatar-stack">
              {demoMembers.map((m) => (
                <MemberAvatar member={m} key={m.id} small />
              ))}
            </div>
          </div>
        </header>
        <div className="demo-notice">
          Fiktive Demo · Montag, 16. November 2026 · Änderungen gelten nur bis
          zum Neuladen.
        </div>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer>
          FamilyOS <span>Alles, was eure Familie bewegt. An einem Ort.</span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile Hauptnavigation">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link
            href={href}
            key={href}
            aria-current={path === href ? "page" : undefined}
            className={path === href ? "active" : ""}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
