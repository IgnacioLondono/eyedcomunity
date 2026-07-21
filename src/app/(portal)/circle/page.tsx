import { Plus } from "lucide-react";
import { CircleClient } from "@/components/circle-client";
import { PageHeader } from "@/components/page-header";
import { requireCommunityViewer } from "@/lib/community-auth";
import { listCirclePosts, listCircles } from "@/lib/circle-store";
import { DEMO_USER_ID, IS_DEMO_MODE } from "@/lib/demo";

export default async function CirclePage() {
  let viewerId = DEMO_USER_ID;
  let circles: Array<{
    id: string; name: string; description: string | null; ownerId: string; role: string; memberCount: number;
  }> = demoCircles;
  let posts: Array<{
    id: string; circleId: string; circleName: string; authorId: string; authorName: string;
    authorAvatarId: string | null; content: string; mediaId: string | null; createdAt: string;
  }> = demoPosts;

  if (!IS_DEMO_MODE) {
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
  }

  return (
    <>
      <PageHeader
        eyebrow="EyedCircle"
        title="Tu círculo"
        description="Un espacio privado para compartir momentos con tus amigos más cercanos."
        action={<span className="secondary-button"><Plus size={17} /> Momentos privados</span>}
      />
      <CircleClient initialCircles={circles} initialPosts={posts} viewerId={viewerId} demo={IS_DEMO_MODE} />
    </>
  );
}

const demoCircles = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Círculo cercano", description: null, ownerId: DEMO_USER_ID, role: "owner", memberCount: 6 },
  { id: "22222222-2222-4222-8222-222222222222", name: "Gaming", description: null, ownerId: "222222222222222222", role: "member", memberCount: 14 },
];

const demoPosts = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    circleId: demoCircles[0].id,
    circleName: demoCircles[0].name,
    authorId: "222222222222222222",
    authorName: "Luna",
    authorAvatarId: null,
    content: "La llamada de anoche fue demasiado buena. Hay que repetir esto el viernes.",
    mediaId: null,
    createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    circleId: demoCircles[1].id,
    circleName: demoCircles[1].name,
    authorId: DEMO_USER_ID,
    authorName: "Nova",
    authorAvatarId: null,
    content: "¿Quién se apunta al torneo de EyedParty esta noche? Ya somos cuatro.",
    mediaId: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];
