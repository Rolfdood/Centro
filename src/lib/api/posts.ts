import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { requestJson } from "@/lib/api/client";
import {
  createPostSchema,
  postIdParamsSchema,
  type CreatePostInput,
} from "@/lib/validations/post";
import {
  postDetailResponseSchema,
  postListResponseSchema,
  type PostDetailDto,
  type PostListItemDto,
} from "@/types";

export const postQueryKeys = {
  all: ["posts"] as const,
  detail: (id: string) => ["posts", id] as const,
};

async function fetchPosts(): Promise<PostListItemDto[]> {
  const response = await requestJson(
    "/api/posts",
    { method: "GET" },
    postListResponseSchema,
  );

  return response.posts;
}

async function fetchPost(id: string): Promise<PostDetailDto> {
  const parsed = postIdParamsSchema.safeParse({ id });
  if (!parsed.success) {
    throw new Error("The requested post is invalid.");
  }

  const response = await requestJson(
    `/api/posts/${parsed.data.id}`,
    { method: "GET" },
    postDetailResponseSchema,
  );

  return response.post;
}

async function createPost(input: CreatePostInput): Promise<PostDetailDto> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Please review the post details and try again.");
  }

  const response = await requestJson(
    "/api/posts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    },
    postDetailResponseSchema,
  );

  return response.post;
}

export function usePosts() {
  return useQuery({
    queryKey: postQueryKeys.all,
    queryFn: fetchPosts,
  });
}

export function usePost(id: string | null | undefined) {
  return useQuery({
    queryKey: postQueryKeys.detail(id ?? ""),
    queryFn: () => fetchPost(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: postQueryKeys.all });
      queryClient.setQueryData(postQueryKeys.detail(post.id), post);
    },
  });
}
