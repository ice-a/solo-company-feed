import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";

export const DEFAULT_DAILY_POST_LIMIT = 10;
const SHANGHAI_OFFSET_HOURS = 8;

type UserLimitSource = {
  dailyPostLimit?: number | null;
} | Record<string, unknown> | null | undefined;

export function getEffectiveDailyPostLimit(user?: UserLimitSource) {
  const limit =
    user && typeof user === "object" && "dailyPostLimit" in user
      ? user.dailyPostLimit
      : undefined;

  if (typeof limit === "number" && limit >= 0) {
    return limit;
  }

  return DEFAULT_DAILY_POST_LIMIT;
}

export function getShanghaiDayRange(now = new Date()) {
  const shifted = new Date(now.getTime() + SHANGHAI_OFFSET_HOURS * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  const start = new Date(Date.UTC(year, month, day, -SHANGHAI_OFFSET_HOURS, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, day + 1, -SHANGHAI_OFFSET_HOURS, 0, 0, 0));

  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

export async function findUserById(uid?: string | null): Promise<Record<string, unknown> | null> {
  if (!uid || !ObjectId.isValid(uid)) {
    return null;
  }

  const db = await getDb();
  return db.collection("users").findOne({ _id: new ObjectId(uid) });
}
