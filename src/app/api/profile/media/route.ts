import { accessErrorResponse, requireCommunityViewer } from "@/lib/community-auth";
import { getBannerColor } from "@/lib/media/service";

export const dynamic = "force-dynamic";

const disabled = {
  error: "Las fotos personalizadas de avatar y banner ya no están disponibles. Usa el color de banner o tu imagen de Discord.",
};

export async function GET() {
  try {
    const { userId } = await requireCommunityViewer();
    return Response.json({
      avatarUrl: null,
      bannerUrl: null,
      bannerColor: await getBannerColor(userId),
    });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function POST() {
  return Response.json(disabled, { status: 410 });
}

export async function DELETE() {
  return Response.json(disabled, { status: 410 });
}
