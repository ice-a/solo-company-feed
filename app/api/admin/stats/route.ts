import { NextRequest, NextResponse } from "next/server";
import { cookieName, isAdminSession, verifySession } from "@/lib/auth";
import { buildOwnedPostFilter } from "@/lib/posts";
import { fetchAuthorBreakdown, fetchDailyStats, fetchStatsSummary, fetchTagStats } from "@/lib/stats";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;
  const session = await verifySession(token);
  const personalFilter = buildOwnedPostFilter(session);
  const adminView = isAdminSession(session);

  const [mine, overall, myTags, myDaily, authors] = await Promise.all([
    fetchStatsSummary(personalFilter),
    fetchStatsSummary({}),
    fetchTagStats(personalFilter, 8),
    fetchDailyStats(personalFilter, 7),
    adminView ? fetchAuthorBreakdown() : Promise.resolve([])
  ]);

  return NextResponse.json({
    mine,
    overall,
    myTags,
    myDaily,
    authors
  });
}
