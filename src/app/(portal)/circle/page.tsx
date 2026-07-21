import Link from "next/link";
import { Plus } from "lucide-react";
import { CircleClient } from "@/components/circle-client";
import { PageHeader } from "@/components/page-header";
import { requireCommunityViewer } from "@/lib/community-auth";
import { listCirclePosts, listCircles } from "@/lib/circle-store";
import { getCommunityDirectory } from "@/lib/eyedbot-api";

export const dynamic = "force-dynamic";

export default async function CirclePage() {
  let viewerId = "";
  let loadError: string | null = null;
  let circles: Array<{
    id: string; name: string; description: string | null; ownerId: string; role: string; memberCount: number;
  }> = [];
  let posts: Array<{
    id: string; circleId: string; circleName: string; authorId: string; authorName: string;
    authorAvatarId: string | null; content: string; mediaId: string | null; createdAt: string;
  }> = [];
  let directory: Array<{
    id: string; username: string; displayName: string; avatarUrl: string | null; status?: string;
  }> = [];

  try {
    const viewer = await requireCommunityViewer();
    viewerId = viewer.userId;
    const [storedCircles, storedPosts, members] = await Promise.all([
      listCircles(viewerId),
      listCirclePosts(viewerId),
      getCommunityDirectory(viewerId).catch(() => []),
    ]);
    circles = storedCircles.map((circle) => ({
      id: circle.id,
      name: circle.name,
      description: circle.description,
      ownerId: circle.ownerId,
      role: circle.role,
      memberCount: circle.memberCount,
    }));
    posts = storedPosts.map((post) => ({
      id: post.id,
      circleId: post.circleId,
      circleName: post.circleName,
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatarId: post.authorAvatarId,
      content: post.content,
      mediaId: post.mediaId,
      createdAt: new Date(post.createdAt).toISOString(),
    }));
    directory = members.map((member) => ({
      id: member.id,
      username: member.username,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      status: member.status,
    }));
  } catch (error) {
    console.error("No se pudo cargar EyedCircle", error);
    loadError = "No pudimos verificar tu acceso o conectar con la base de datos.";
  }

  return (
    <>
      <PageHeader
        eyebrow="EyedCircle"
        title="Tu círculo"
        description="Un espacio privado para compartir momentos con tus amigos más cercanos."
        action={<Link className="secondary-button" href="#circle-manager"><Plus size={17} /> Crear círculo</Link>}
      />
      {loadError ? (
        <section className="empty-card">
          <h2>EyedCircle no está disponible</h2>
          <p>{loadError} Inténtalo nuevamente cuando EyedBot esté conectado.</p>
        </section>
      ) : (
        <CircleClient initialCircles={circles} initialPosts={posts} directory={directory} viewerId={viewerId} />
      )}
    </>
  );
}
