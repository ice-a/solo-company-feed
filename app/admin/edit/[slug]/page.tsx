import { getDb } from "@/lib/mongo";
import { notFound } from "next/navigation";
import { EditPostForm } from "@/components/EditPostForm";

export const dynamic = "force-dynamic";

async function fetchPost(slug: string) {
  const db = await getDb();
  const post = await db.collection("posts").findOne({ slug });
  if (!post) return null;
  return {
    ...post,
    _id: post._id?.toString()
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
