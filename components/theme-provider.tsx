"use client";

import { createClient } from "@/lib/supabase/client";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(preference: ThemePreference) {
  const resolvedTheme = preference === "system" ? getSystemTheme() : preference;
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  document.documentElement.dataset.theme = preference;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem("easy-collection-theme") as ThemePreference | null;
    return stored ?? "system";
  });

  useEffect(() => {
    const stored = window.localStorage.getItem("easy-collection-theme") as ThemePreference | null;
    const initial = stored ?? "system";

    applyTheme(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (initial === "system") applyTheme("system");
    };
    media.addEventListener("change", handleSystemChange);

    fetch("/api/preferences/theme")
      .then((response) => response.json())
      .then((data: { theme?: ThemePreference }) => {
        if (data.theme) {
          setPreference(data.theme);
          window.localStorage.setItem("easy-collection-theme", data.theme);
          applyTheme(data.theme);
        }
      })
      .catch(() => undefined);

    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  function changeTheme(nextTheme: ThemePreference) {
    setPreference(nextTheme);
    window.localStorage.setItem("easy-collection-theme", nextTheme);
    applyTheme(nextTheme);

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        void fetch("/api/preferences/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: nextTheme }),
        });
      }
    });
  }

  return (
    <ThemeContext.Provider value={{ preference, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

type ThemeContextValue = {
  preference: ThemePreference;
  changeTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}