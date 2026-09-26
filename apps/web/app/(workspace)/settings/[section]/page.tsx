import { notFound } from "next/navigation";
import { SettingsView } from "../../../../src/components/settings/settings-view";

export default async function SettingsPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section !== "warehouses" && section !== "locations") notFound();
  return <SettingsView section={section} />;
}
