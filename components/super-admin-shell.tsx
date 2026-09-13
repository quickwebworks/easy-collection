"use client";

import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Smartphone,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeSelector from "@/components/theme-selector";

const navigation = [
  { href: "/super-admin", label: "Overview", icon: LayoutDashboard },
  { href: "/super-admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/super-admin/users", label: "Users", icon: Users },
  { href: "/super-admin/packages", label: "Packages", icon: Package },
  { href: "/super-admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/super-admin/loan-types", label: "Loan Types", icon: FileText },
  { href: "/super-admin/payments", label: "Payments", icon: WalletCards },
  { href: "/super-admin/activity-logs", label: "Activity Logs", icon: BarChart3 },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
  { href: "/backend/sms-master", label: "SMS Master", icon: Smartphone },
];

const quickNavigation = [
  { href: "#activity", label: "Activity", icon: BarChart3 },
  { href: "#appearance", label: "Appearance", icon: Settings },
];

export default function SuperAdminShell({
  children,
  email,
}: {
  children: ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = email.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-xl lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>
          <Link href="/super-admin" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground">EC</span>
            <span className="text-sm font-extrabold tracking-tight sm:text-base">Easy Collection</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block"><ThemeSelector /></div>
          <div className="hidden text-right md:block">
            <p className="text-sm font-bold">Super Admin</p>
            <p className="text-[11px] text-muted-foreground">Platform Administrator</p>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">{initials}</span>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="hidden min-h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-border/80 px-4 py-6 lg:flex">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = href === "/super-admin" && pathname === href;
              return href.startsWith("#") ? (
                <a key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <Icon size={18} />{label}
                </a>
              ) : (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <Icon size={18} />{label}
                </Link>
              );
            })}
            {quickNavigation.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <Icon size={18} />{label}
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-12">
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
              <LogOut size={18} /> Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border/80 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        {[navigation[0], ...quickNavigation].map(({ href, label, icon: Icon }) => {
          const active = href === "/super-admin" && pathname === href;
          return href.startsWith("#") ? (
            <a key={href} href={href} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold text-muted-foreground"><Icon size={19} />{label}</a>
          ) : (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}><Icon size={19} />{label}</Link>
          );
        })}
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-foreground/30" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <aside className="relative h-full w-[min(20rem,86vw)] bg-background p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold">Menu</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label="Close navigation"><X size={20} /></button>
            </div>
            <nav className="mt-8 space-y-1">
              {[...navigation, ...quickNavigation].map(({ href, label, icon: Icon }) => (
                <a key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><Icon size={18} />{label}</a>
              ))}
            </nav>
            <div className="mt-8 sm:hidden"><ThemeSelector /></div>
          </aside>
        </div>
      )}
    </div>
  );
}