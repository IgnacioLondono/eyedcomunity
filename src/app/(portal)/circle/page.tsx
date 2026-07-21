import { Plus } from "lucide-react";
import { CircleClient } from "@/components/circle-client";
import { PageHeader } from "@/components/page-header";
import { requireCommunityViewer } from "@/lib/community-auth";
import { listCirclePosts, listCircles } from "@/lib/circle-store";

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

  try {
    const viewer = await requireCommunityViewer();
    viewerId = viewer.userId;
    const [storedCircles, storedPosts] = await Promise.all([
      listCircles(viewerId),
      listCirclePosts(viewerId),
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
        action={<span className="secondary-button"><Plus size={17} /> Momentos privados</span>}
      />
      {loadError ? (
        <section className="empty-card">
          <h2>EyedCircle no está disponible</h2>
          <p>{loadError} Inténtalo nuevamente cuando EyedBot esté conectado.</p>
        </section>
      ) : (
        <CircleClient initialCircles={circles} initialPosts={posts} viewerId={viewerId} />
      )}
    </>
  );
}
