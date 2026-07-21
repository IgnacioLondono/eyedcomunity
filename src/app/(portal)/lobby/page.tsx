import { redirect } from "next/navigation";
import { Radio, Users } from "lucide-react";
import { auth } from "@/auth";
import { MemberLobby } from "@/components/member-lobby";
import { PageHeader } from "@/components/page-header";
import { EyedBotApiError, getCommunityMembers } from "@/lib/eyedbot-api";
import { getProfileMediaBatch } from "@/lib/media/service";

export default async function LobbyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;

  let members: Awaited<ReturnType<typeof getCommunityMembers>> | null = null;
  try {
    members = await getCommunityMembers(userId);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
  }

  if (!members) return <div className="empty-card"><h1>El lobby no está disponible</h1><p>Inténtalo nuevamente en unos minutos.</p></div>;
  try {
    const customMedia = await getProfileMediaBatch(members.map((member) => member.id));
    members = members.map((member) => {
      const custom = customMedia.get(member.id);
      return {
        ...member,
        avatarUrl: custom?.avatarUrl || member.avatarUrl,
        bannerUrl: custom?.bannerUrl || member.bannerUrl,
      };
    });
  } catch (error) {
    console.error("No se pudieron cargar los perfiles personalizados", error);
  }
  const online = members.filter((member) => member.status !== "offline").length;
  return (
    <>
      <PageHeader
        eyebrow="Comunidad"
        title="Lobby"
        description="Descubre quién está conectado, encuentra amigos y visita los perfiles de la comunidad."
        action={<div className="lobby-live"><Radio size={16} /><strong>{online}</strong> conectados ahora</div>}
      />
      <div className="lobby-welcome">
        <Users />
        <div><strong>La plaza de EyedComun</strong><span>Los perfiles solo son visibles para miembros del servidor.</span></div>
      </div>
      <MemberLobby members={members} />
    </>
  );
}
