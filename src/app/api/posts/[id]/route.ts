import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toPostDetailDto, postWithRelationsInclude } from "@/lib/posts";
import { validationErrorSchema } from "@/lib/validations/common";
import { postIdParamsSchema } from "@/lib/validations/post";
import { postDetailResponseSchema } from "@/types";

interface PostRouteContext {
  params: { id: string };
}

export async function GET(
  _request: Request,
  { params }: PostRouteContext,
): Promise<NextResponse> {
  const authentication = await getAuthenticatedUser();
  if (!authentication.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postParams = postIdParamsSchema.safeParse(params);
  if (!postParams.success) {
    return NextResponse.json(
      validationErrorSchema.parse({ error: "Invalid request." }),
      { status: 400 },
    );
  }

  try {
    const post = await db.post.findFirst({
      where: {
        id: postParams.data.id,
        userId: authentication.userId,
      },
      include: postWithRelationsInclude,
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    return NextResponse.json(
      postDetailResponseSchema.parse({ post: toPostDetailDto(post) }),
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load post." },
      { status: 500 },
    );
  }
}
