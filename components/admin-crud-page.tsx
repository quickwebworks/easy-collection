"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Ban,
  CheckCircle2,
  Mail,
  MessageCircle,
  PauseCircle,
  Plus,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "select" | "textarea" | "checkbox";
  required?: boolean;
  options?: string[];
};

export type CrudConfig = {
  table: string;
  title: string;
  description: string;
  fields: Field[];
  searchFields: string[];
  columns?: string[];
};

type Row = Record<string, unknown> & { id?: string };

export default function AdminCrudPage({ config }: { config: CrudConfig }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Row>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [organizationOptions, setOrganizationOptions] = useState<{ id: string; name: string }[]>([]);
  const [packageOptions, setPackageOptions] = useState<{ id: string; name: string }[]>([]);

  async function loadRows() {
    setLoading(true);
    if (config.table === "profiles") {
      const response = await fetch("/api/super-admin/users");
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setError(result.error ?? "Unable to load users.");
      else { setRows((result.users ?? []) as Row[]); setOrganizationOptions(result.organizations ?? []); }
      setLoading(false);
      return;
    }
    if (config.table === "subscriptions" || config.table === "payments") {
      fetch("/api/super-admin/billing/options").then((response) => response.json()).then((result) => {
        if (result.organizations) setOrganizationOptions(result.organizations);
        if (result.packages) setPackageOptions(result.packages);
      });
    }
    const { data, error: queryError } = await createClient()
      .from(config.table)
      .select("*")
      .order("created_at", { ascending: false });
    if (queryError) setError(queryError.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    if (config.table === "profiles") {
      fetch("/api/super-admin/users")
        .then((response) => response.json())
        .then((result) => {
          if (cancelled) return;
          if (result.error) setError(result.error);
          else {
            setRows((result.users ?? []) as Row[]);
            setOrganizationOptions(result.organizations ?? []);
          }
          setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
    createClient()
      .from(config.table)
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) setError(queryError.message);
        else setRows((data ?? []) as Row[]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config.table]);

  function openCreate() {
    setEditingId(null);
    setForm(
      Object.fromEntries(
        config.fields.map((field) => [
          field.name,
          field.type === "checkbox"
            ? true
            : field.name === "status"
              ? "ACTIVE"
              : "",
        ]),
      ),
    );
    setFormOpen(true);
    setError("");
    setMessage("");
  }

  function openEdit(row: Row) {
    setEditingId(row.id ?? null);
    setForm({ ...row });
    setFormOpen(true);
    setError("");
    setMessage("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const payload = { ...form };
    let saveError: { message: string } | null = null;
    if (editingId) delete payload.id;
    if (
      config.table === "organizations" &&
      typeof payload.status === "string"
    ) {
      payload.is_active = payload.status === "ACTIVE";
    }
    if (config.table === "profiles" && !editingId) {
      const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); saveError = { message: result.error ?? "Unable to create user." }; }
    } else if (config.table === "packages" && !editingId) {
      const response = await fetch("/api/super-admin/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); saveError = { message: result.error ?? "Unable to create package." }; }
    } else if (config.table === "organizations" && !editingId && !payload.slug) {
      const baseSlug =
        String(payload.name ?? "organization")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "organization";
      payload.slug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    if (config.table === "profiles" && !editingId || config.table === "packages" && !editingId) {
      // The Auth user and organization membership are created by the protected server route above.
    } else if (config.table === "organizations" && !editingId) {
      const response = await fetch("/api/super-admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        saveError = {
          message: result.error ?? "Unable to create organization.",
        };
      }
    } else {
      const query = editingId
        ? createClient().from(config.table).update(payload).eq("id", editingId)
        : createClient().from(config.table).insert(payload);
      const result = await query;
      saveError = result.error;
    }
    if (saveError) setError(saveError.message);
    else {
      setForm({});
      setEditingId(null);
      setFormOpen(false);
      await loadRows();
    }
    setSaving(false);
  }

  async function remove(row: Row) {
    if (
      !row.id ||
      !window.confirm("Delete this record? This cannot be undone.")
    )
      return;
    const { error: deleteError } = await createClient()
      .from(config.table)
      .delete()
      .eq("id", row.id);
    if (deleteError) setError(deleteError.message);
    else await loadRows();
  }

  async function resendOrganizationEmail(row: Row) {
    if (config.table !== "organizations" || !row.id) return;
    setError("");
    setMessage("");
    const response = await fetch("/api/super-admin/organizations/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: row.id }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Unable to send the email.");
      return;
    }
    setMessage("Welcome email sent successfully.");
  }

  async function resendOrganizationWhatsApp(row: Row) {
    if (config.table !== "organizations" || !row.id) return;
    setError("");
    setMessage("");
    const response = await fetch("/api/super-admin/organizations/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: row.id }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Unable to send the WhatsApp message.");
      return;
    }
    setMessage("WhatsApp message sent successfully.");
  }

  async function changeOrganizationStatus(
    row: Row,
    status: "ACTIVE" | "BLOCKED" | "SUSPENDED",
  ) {
    if (config.table !== "organizations" || !row.id) return;
    const action =
      status === "ACTIVE"
        ? "activate"
        : status === "BLOCKED"
          ? "block"
          : "suspend";
    if (
      !window.confirm(`Are you sure you want to ${action} this organization?`)
    )
      return;
    setError("");
    setMessage("");
    const response = await fetch("/api/super-admin/organizations/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: row.id, status }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.error ?? "Unable to update organization status.");
      return;
    }
    setMessage(`Organization ${action}d successfully.`);
    await loadRows();
  }

  const visibleRows = rows.filter((row) => {
    const matchesSearch =
      search.trim() === "" ||
      config.searchFields.some((field) =>
        String(row[field] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    const matchesStatus =
      config.table !== "organizations" ||
      statusFilter === "ALL" ||
      String(row.status ?? "ACTIVE") === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const columns =
    config.columns ?? config.fields.slice(0, 4).map((field) => field.name);
  const columnLabels = new Map(
    config.fields.map((field) => [field.name, field.label]),
  );
  const formatValue = (row: Row, column: string) => {
    if (column === "created_at")
      return row.created_at
        ? new Date(String(row.created_at)).toLocaleDateString()
        : "-";
    if (column === "is_active") return row.is_active ? "Active" : "Inactive";
    return String(row[column] ?? "-");
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Super Admin
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {config.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <Plus size={18} /> Add {config.title.replace(/s$/, "")}
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-border/80 bg-card">
        <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold">{visibleRows.length} records</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm text-muted-foreground">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  config.table === "organizations"
                    ? "Search organizations..."
                    : `Search ${config.title.toLowerCase()}...`
                }
                className="min-w-0 bg-transparent outline-none"
              />
            </label>
            {config.table === "organizations" && (
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Organization status"
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-semibold outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            )}
          </div>
        </div>
        {error && (
          <p className="mx-4 mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        {message && (
          <p className="mx-4 mt-4 rounded-xl bg-primary/10 p-3 text-sm text-primary">
            {message}
          </p>
        )}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-bold">
                    {columnLabels.get(column) ?? column}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Loading organizations...
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No organizations found.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr key={String(row.id)} className="hover:bg-muted/40">
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="max-w-[240px] truncate px-4 py-4 font-medium"
                      >
                        {column === "organization_id" ? organizationOptions.find((organization) => organization.id === row.organization_id)?.name ?? "Unassigned" : formatValue(row, column)}
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        {config.table === "organizations" && (
                          <>
                            {row.status === "ACTIVE" ? (
                              <>
                                <button
                                  type="button"
                                  title="Block organization"
                                  onClick={() => void changeOrganizationStatus(row, "BLOCKED")}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Ban size={16} />
                                </button>
                                <button
                                  type="button"
                                  title="Suspend organization"
                                  onClick={() => void changeOrganizationStatus(row, "SUSPENDED")}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600"
                                >
                                  <PauseCircle size={16} />
                                </button>
                              </>
                            ) : row.status === "BLOCKED" || row.status === "SUSPENDED" ? (
                              <button
                                type="button"
                                title="Activate organization"
                                onClick={() => void changeOrganizationStatus(row, "ACTIVE")}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              title="Send WhatsApp again"
                              onClick={() =>
                                void resendOrganizationWhatsApp(row)
                              }
                              className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button
                              type="button"
                              title="Send welcome email again"
                              onClick={() => void resendOrganizationEmail(row)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            >
                              <Mail size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(row)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => void remove(row)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading organizations...
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No organizations found.
            </div>
          ) : (
            visibleRows.map((row) => (
              <article
                key={String(row.id)}
                className="rounded-xl border border-border/80 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{formatValue(row, "name")}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {formatValue(row, "created_at")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${row.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    {formatValue(row, "is_active")}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Email</dt>
                    <dd className="mt-1 truncate font-medium">
                      {formatValue(row, "contact_email")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Phone</dt>
                    <dd className="mt-1 font-medium">
                      {formatValue(row, "phone")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">City</dt>
                    <dd className="mt-1 font-medium">
                      {formatValue(row, "city")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-end gap-2 border-t border-border/70 pt-3">
                  {config.table === "organizations" && (
                    <>
                      {row.status === "ACTIVE" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void changeOrganizationStatus(row, "BLOCKED")}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-destructive hover:bg-destructive/10"
                          >
                            <Ban size={14} /> Block
                          </button>
                          <button
                            type="button"
                            onClick={() => void changeOrganizationStatus(row, "SUSPENDED")}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-amber-600 hover:bg-amber-500/10"
                          >
                            <PauseCircle size={14} /> Suspend
                          </button>
                        </>
                      ) : row.status === "BLOCKED" || row.status === "SUSPENDED" ? (
                        <button
                          type="button"
                          onClick={() => void changeOrganizationStatus(row, "ACTIVE")}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10"
                        >
                          <CheckCircle2 size={14} /> Activate
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void resendOrganizationWhatsApp(row)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10"
                      >
                        <MessageCircle size={14} /> WhatsApp again
                      </button>
                      <button
                        type="button"
                        onClick={() => void resendOrganizationEmail(row)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary/10"
                      >
                        <Mail size={14} /> Email again
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-muted"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold">
                  {editingId ? "Edit" : "Add"} {config.title.replace(/s$/, "")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep the record details up to date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm({});
                  setEditingId(null);
                  setFormOpen(false);
                }}
                className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={save} className="mt-6 space-y-4">
              {config.fields.map((field) => (
                <label key={field.name} className="block text-sm font-semibold">
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                  {field.type === "checkbox" ? (
                    <span className="mt-2 flex items-center gap-2 font-normal">
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.name])}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [field.name]: event.target.checked,
                          })
                        }
                      />{" "}
                      Active
                    </span>
                  ) : field.type === "textarea" ? (
                    <textarea
                      required={field.required}
                      value={String(form[field.name] ?? "")}
                      onChange={(event) =>
                        setForm({ ...form, [field.name]: event.target.value })
                      }
                      className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 font-normal outline-none focus:border-primary"
                    />
                  ) : field.type === "select" ? (
                    <select
                      required={field.required}
                      value={String(form[field.name] ?? "")}
                      onChange={(event) =>
                        setForm({ ...form, [field.name]: event.target.value })
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:border-primary"
                    >
                      <option value="">Select...</option>
                      {field.name === "organization_id"
                        ? organizationOptions.map((organization) => (
                            <option key={organization.id} value={organization.id}>
                              {organization.name}
                            </option>
                          ))
                        : field.name === "package_id"
                          ? packageOptions.map((packageOption) => (
                              <option key={packageOption.id} value={packageOption.id}>{packageOption.name}</option>
                            ))
                        : field.options?.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                    </select>
                  ) : (
                    <input
                      required={field.required}
                      type={field.type ?? "text"}
                      value={String(form[field.name] ?? "")}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          [field.name]:
                            field.type === "number"
                              ? Number(event.target.value)
                              : event.target.value,
                        })
                      }
                      className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 py-2 font-normal outline-none focus:border-primary"
                    />
                  )}
                </label>
              ))}
              {error && (
                <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
