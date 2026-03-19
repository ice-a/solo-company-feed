import { getDb } from "@/lib/mongo";
import { notFound } from "next/navigation";
import { EditPostForm } from "@/components/EditPostForm";
import { Post } from "@/types/post";
import { DEFAULT_OPC_SIGNAL } from "@/lib/opc";

export const dynamic = "force-dynamic";

async function fetchPost(slug: string): Promise<Post | null> {
  const db = await getDb();
  const post = await db.collection("posts").findOne({ slug });
  if (!post) return null;
  return {
    _id: post._id?.toString(),
    title: post.title ?? "",
    slug: post.slug ?? slug,
    markdown: post.markdown ?? "",
    cover: post.cover,
    tags: post.tags ?? [],
    signal: post.signal ?? DEFAULT_OPC_SIGNAL,
    author: post.author ?? "佚名",
    createdAt: post.createdAt ?? new Date().toISOString(),
    updatedAt: post.updatedAt ?? post.createdAt ?? new Date().toISOString(),
    views: post.views ?? 0
  };
}

export default async function EditPostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <EditPostForm post={post} />
    </div>
  );
}
