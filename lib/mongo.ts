import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "pushinfo";

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  }
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
  db = client.db(dbName);
  return db;
}
