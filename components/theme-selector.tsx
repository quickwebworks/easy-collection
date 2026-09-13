"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { ThemePreference, useTheme } from "@/components/theme-provider";

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

export default function ThemeSelector() {
  const { preference, changeTheme } = useTheme();

  return (
    <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1" aria-label="Choose appearance">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => changeTheme(value)}
          aria-pressed={preference === value}
          title={`${label} mode`}
          className={`flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition ${
            preference === value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon size={15} strokeWidth={2.2} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}