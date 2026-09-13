import ThemeSelector from "@/components/theme-selector";

const cards = [
  { label: "Organizations", value: "2", detail: "1 needs attention", tone: "bg-secondary text-secondary-foreground" },
  { label: "Active users", value: "3", detail: "All accounts active", tone: "bg-accent text-accent-foreground" },
  { label: "Collections today", value: "₹0", detail: "No collections recorded", tone: "bg-primary/10 text-primary" },
];

export default function SuperAdminPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Sunday, September 13</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Good morning.</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Here is the pulse of your collection platform today.</p>
        </div>
        <div className="sm:hidden"><ThemeSelector /></div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_10px_30px_-20px_currentColor]">
            <div className={`mb-8 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${card.tone}`}>{card.label}</div>
            <p className="text-3xl font-extrabold tracking-tight">{card.value}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{card.detail}</p>
          </div>
        ))}
      </section>

      <section id="activity" className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Platform activity</h2><p className="mt-1 text-xs text-muted-foreground">The last 7 days</p></div><span className="rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">Live</span></div>
          <div className="mt-8 flex h-32 items-end gap-2 sm:gap-4">
            {[32, 48, 38, 68, 54, 82, 72].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-lg ${index === 5 ? "bg-primary" : "bg-primary/20"}`} style={{ height: `${height}%` }} /><span className="text-[10px] font-semibold text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"][index]}</span></div>)}
          </div>
        </div>
        <div id="appearance" className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6"><h2 className="font-bold">Appearance</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose how Easy Collection looks on this device. Your choice syncs to your account.</p><div className="mt-5"><ThemeSelector /></div></div>
      </section>
    </div>
  );
}
