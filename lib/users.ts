import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongo";

export const DEFAULT_DAILY_POST_LIMIT = 10;
const SHANGHAI_OFFSET_HOURS = 8;

export function getEffectiveDailyPostLimit(user?: { dailyPostLimit?: number | null }) {
  if (typeof user?.dailyPostLimit === "number" && user.dailyPostLimit >= 0) {
    return user.dailyPostLimit;
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

export async function findUserById(uid?: string | null) {
  if (!uid || !ObjectId.isValid(uid)) {
    return null;
  }

  const db = await getDb();
  return db.collection("users").findOne({ _id: new ObjectId(uid) });
}
