
import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "janget";

// Next.js may import this module during Docker build.
// Use a local placeholder only when the production build has no URI.
// The real application runtime must have MONGODB_URI configured.
const connectionUri =
  uri || "mongodb://127.0.0.1:27017";

type MongoGlobal = typeof globalThis & {
  mongoClient?: MongoClient;
  mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as MongoGlobal;

export const mongoClient =
  globalForMongo.mongoClient ?? new MongoClient(connectionUri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = mongoClient;
}

export const mongoDb: Db = mongoClient.db(dbName);

function getClientPromise(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "Missing MONGODB_URI environment variable at runtime"
    );
  }

  if (!globalForMongo.mongoClientPromise) {
    globalForMongo.mongoClientPromise = mongoClient.connect();
  }

  return globalForMongo.mongoClientPromise;
}

export async function getMongoClient(): Promise<MongoClient> {
  return getClientPromise();
}

export async function getMongoDb(): Promise<Db> {
  await getClientPromise();
  return mongoDb;
}