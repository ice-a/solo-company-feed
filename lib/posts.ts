import { SessionPayload, isAdminSession } from "@/lib/auth";
import { DEFAULT_OPC_SIGNAL } from "@/lib/opc";
import { Post } from "@/types/post";

function buildLegacyAuthorFilter(session: SessionPayload) {
  if (!session.name) {
    return null;
  }

  return {
    $and: [
      {
        $or: [{ ownerId: { $exists: false } }, { ownerId: null }]
      },
      { author: session.name }
    ]
  };
}

export function buildOwnedPostFilter(session?: SessionPayload | null) {
  if (!session?.uid) {
    return { _id: { $exists: false } };
  }

  const filters: Record<string, unknown>[] = [{ ownerId: session.uid }];
  const legacyAuthorFilter = buildLegacyAuthorFilter(session);
  if (legacyAuthorFilter) {
    filters.push(legacyAuthorFilter);
  }

  return { $or: filters };
}

export function buildPostScopeFilter(session?: SessionPayload | null) {
  return buildOwnedPostFilter(session);
}

export function isPostOwner(doc: any, session?: SessionPayload | null) {
  if (!session?.uid) {
    return false;
  }

  if (doc?.ownerId === session.uid) {
    return true;
  }

  return !doc?.ownerId && Boolean(session.name) && doc?.author === session.name;
}

export function buildScopedPostFilter(
  session: SessionPayload | null | undefined,
  filters: Record<string, unknown>[] = []
) {
  const scopedFilters = [buildPostScopeFilter(session), ...filters].filter(
    (item) => Object.keys(item).length > 0
  );

  if (scopedFilters.length === 0) {
    return {};
  }

  if (scopedFilters.length === 1) {
    return scopedFilters[0];
  }

  return { $and: scopedFilters };
}

export function canAccessPost() {
  return true;
}

export function canEditPost(doc: any, session?: SessionPayload | null) {
  return isPostOwner(doc, session);
}

export function canDeletePost(doc: any, session?: SessionPayload | null) {
  return Boolean(doc && isAdminSession(session));
}

export function serializePost(doc: any): Post {
  return {
    _id: doc._id?.toString(),
    title: doc.title ?? "",
    slug: doc.slug ?? "",
    markdown: doc.markdown ?? "",
    cover: doc.cover,
    tags: doc.tags ?? [],
    signal: doc.signal ?? DEFAULT_OPC_SIGNAL,
    author: doc.author ?? "匿名",
    ownerId: doc.ownerId,
    createdAt: doc.createdAt ?? new Date().toISOString(),
    updatedAt: doc.updatedAt ?? doc.createdAt ?? new Date().toISOString(),
    views: doc.views ?? 0
  };
}
