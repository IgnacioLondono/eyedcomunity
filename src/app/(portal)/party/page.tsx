import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PartyClient } from "@/components/party-client";
import { PageHeader } from "@/components/page-header";
import { EyedBotApiError, listCommunityParties } from "@/lib/eyedbot-api";

export default async function PartyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  let parties;
  try {
    parties = (await listCommunityParties(session.user.id)).parties;
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <section className="empty-card"><h1>EyedParty no está disponible</h1><p>EyedBot no pudo cargar las partidas.</p></section>;
  }
  return (
    <>
      <PageHeader eyebrow="Diversión" title="EyedParty" description="Trivia y dados con estado persistente y actualizaciones en vivo." />
      <PartyClient initialParties={parties} viewerId={session.user.id} wsUrl={process.env.EYEDBOT_WS_URL?.trim() || null} />
    </>
  );
}
