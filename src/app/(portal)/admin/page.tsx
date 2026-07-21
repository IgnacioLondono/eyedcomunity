import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { AdminSettingsClient } from "@/components/admin-settings-client";
import { PageHeader } from "@/components/page-header";
import { getCommunitySettings } from "@/lib/eyedbot-api";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const response = await getCommunitySettings(session.user.id).catch(() => null);
  if (!response?.isAdmin) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Control de EyedComun"
        description="Activa módulos, controla notificaciones y administra el acceso al portal."
        action={<span className="secondary-button"><ShieldCheck size={17} /> Acceso protegido</span>}
      />
      <AdminSettingsClient initialSettings={response.settings} />
    </>
  );
}
