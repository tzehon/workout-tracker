import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db } from "mongodb";

let mongod: MongoMemoryServer | null = null;
let client: MongoClient | null = null;
let db: Db | null = null;

export async function setupTestDatabase(): Promise<Db> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  client = new MongoClient(uri);
  await client.connect();
  db = client.db("test-workout-tracker");
  return db;
}

export async function teardownTestDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
  db = null;
}

export async function clearTestDatabase(): Promise<void> {
  if (db) {
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }
}

export function getTestDatabase(): Db {
  if (!db) {
    throw new Error("Test database not initialized. Call setupTestDatabase first.");
  }
  return db;
}
