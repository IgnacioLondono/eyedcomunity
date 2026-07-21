import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PartyClient } from "@/components/party-client";
import { PageHeader } from "@/components/page-header";
import { EyedBotApiError, getCommunityDirectory, listCommunityParties } from "@/lib/eyedbot-api";

export default async function PartyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  let parties;
  let directory: Array<{
    id: string; username: string; displayName: string; avatarUrl: string | null; status?: string;
  }> = [];
  try {
    const [partyPayload, members] = await Promise.all([
      listCommunityParties(session.user.id),
      getCommunityDirectory(session.user.id).catch(() => []),
    ]);
    parties = partyPayload.parties;
    directory = members.map((member) => ({
      id: member.id,
      username: member.username,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      status: member.status,
    }));
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <section className="empty-card"><h1>EyedParty no está disponible</h1><p>EyedBot no pudo cargar las partidas.</p></section>;
  }
  return (
    <>
      <PageHeader
        eyebrow="Diversión"
        title="EyedParty"
        description="Trivia y dados con salas en vivo. Añade gente del servidor sin copiar IDs."
      />
      <PartyClient
        initialParties={parties}
        directory={directory}
        viewerId={session.user.id}
        wsUrl={process.env.EYEDBOT_WS_URL?.trim() || null}
      />
    </>
  );
}
