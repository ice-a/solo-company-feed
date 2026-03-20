import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EditPostForm } from "@/components/EditPostForm";
import { cookieName, verifySession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { canEditPost, serializePost } from "@/lib/posts";
import { Post } from "@/types/post";

export const dynamic = "force-dynamic";

async function fetchPost(
  slug: string,
  session: Awaited<ReturnType<typeof verifySession>>
): Promise<Post | null> {
  const db = await getDb();
  const post = await db.collection("posts").findOne({ slug });

  if (!post || !canEditPost(post, session)) {
    return null;
  }

  return serializePost(post);
}

export default async function EditPostPage({ params }: { params: { slug: string } }) {
  const token = cookies().get(cookieName)?.value;
  const session = await verifySession(token);
  const post = await fetchPost(params.slug, session);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <EditPostForm post={post} />
    </div>
  );
}
