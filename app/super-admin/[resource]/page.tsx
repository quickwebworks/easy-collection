import AdminCrudPage from "@/components/admin-crud-page";
import { crudConfigs } from "@/lib/admin-crud-configs";
import { notFound } from "next/navigation";

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const config = crudConfigs[resource];
  if (!config) notFound();
  return <AdminCrudPage config={config} />;
}