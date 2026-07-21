import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { PlansClient } from "@/components/plans-client";
import { EyedBotApiError, listCommunityPlans } from "@/lib/eyedbot-api";

export default async function PlansPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  let plans;
  try {
    plans = (await listCommunityPlans(session.user.id)).plans;
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <section className="empty-card"><h1>Las quedadas no están disponibles</h1><p>EyedBot no pudo cargar los planes.</p></section>;
  }
  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Quedadas" description="Crea, administra y participa en planes persistidos por EyedBot." />
      <PlansClient plans={plans} viewerId={session.user.id} />
    </>
  );
}
