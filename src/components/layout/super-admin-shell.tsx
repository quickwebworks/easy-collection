"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { superAdminNavigation } from "@/app/super-admin/src/constants/super-admin-navigation";

export default function SuperAdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <Link
          href="/super-admin"
          className="font-bold text-blue-600"
        >
          Easy Collection
        </Link>

        <div className="h-9 w-9 rounded-full bg-blue-100 text-center leading-9 font-semibold text-blue-700">
          A
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="border-b border-slate-200 px-6 py-5">
              <Link
                href="/super-admin"
                className="text-xl font-bold text-blue-600"
              >
                Easy Collection
              </Link>

              <p className="mt-1 text-xs text-slate-500">
                Super Admin
              </p>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {superAdminNavigation.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/super-admin" &&
                    pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setMobileOpen(false)}
            />

            <aside className="relative h-full w-72 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <p className="font-bold text-blue-600">
                    Easy Collection
                  </p>
                  <p className="text-xs text-slate-500">
                    Super Admin
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <nav className="space-y-1 p-4">
                {superAdminNavigation.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/super-admin" &&
                      pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-lg px-4 py-3 text-sm font-medium ${
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Area */}
        <main className="min-w-0 flex-1">
          <div className="hidden h-16 items-center justify-end border-b border-slate-200 bg-white px-6 lg:flex">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  Super Admin
                </p>
                <p className="text-xs text-slate-500">
                  Platform Administrator
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                A
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}