const dashboardCards = [
  {
    title: "Total Organizations",
    value: "2",
    description: "Registered organizations",
  },
  {
    title: "Active Organizations",
    value: "2",
    description: "Currently active",
  },
  {
    title: "Blocked Organizations",
    value: "0",
    description: "Currently blocked",
  },
  {
    title: "Active Subscriptions",
    value: "0",
    description: "Active subscriptions",
  },
  {
    title: "Subscription Revenue",
    value: "₹0",
    description: "Total subscription revenue",
  },
  {
    title: "Total Users",
    value: "3",
    description: "Registered platform users",
  },
  {
    title: "Active Users",
    value: "3",
    description: "Currently active users",
  },
  {
    title: "Loan Types",
    value: "0",
    description: "Configured loan types",
  },
];

export default function SuperAdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold text-blue-600">
          OVERVIEW
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Super Admin Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage the Easy Collection platform.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {card.title}
            </p>

            <p className="mt-3 text-3xl font-bold text-slate-900">
              {card.value}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Platform Status
          </h2>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-green-500" />

            <div>
              <p className="font-medium text-slate-900">
                System Operational
              </p>

              <p className="text-sm text-slate-500">
                Easy Collection is running normally.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Quick Actions
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              href="/super-admin/organizations"
              className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Manage Organizations
            </a>

            <a
              href="/super-admin/loan-types"
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manage Loan Types
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}