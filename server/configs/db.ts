import { MongoClient, ServerApiVersion, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db;

export async function connectDB(): Promise<Db> {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGO_DB_NAME || "Duy04");
    console.log("✅ MongoDB connected (native driver)");
  }
  return db;
}

export async function ensureIndexes() {
  const database = await connectDB();
  const users = database.collection("users");
  await users.createIndex({ email: 1 }, { unique: true, name: "uniq_email" });
  await users.createIndex(
    { username: 1 },
    { unique: true, name: "uniq_username" }
  );
  console.log("✅ Indexes ensured (email, username)");
}
