import { Db, MongoClient } from "mongodb";

const dbName = process.env.MONGODB_DB || "pushinfo";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }
  return uri;
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(getMongoUri(), { serverSelectionTimeoutMS: 5000 });
  }
  await client.connect();
  db = client.db(dbName);
  return db;
}
