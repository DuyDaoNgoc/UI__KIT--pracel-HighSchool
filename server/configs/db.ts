// server/configs/db.ts
import { MongoClient, ServerApiVersion, Db } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI as string;
if (!uri) {
  throw new Error("❌ Missing MONGO_URI in .env");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // fix lỗi ssl trên windows khi dùng Atlas hoặc local
  ssl: uri.startsWith("mongodb+srv"), // Atlas thì true, local thì false
  tlsAllowInvalidCertificates: true,
});

let db: Db;

export async function connectDB(): Promise<Db> {
  if (!db) {
    try {
      await client.connect();
      db = client.db(process.env.MONGO_DB_NAME || "Duy04");
      console.log(
        `✅ MongoDB connected → ${process.env.MONGO_DB_NAME || "Duy04"}`
      );
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err);
      process.exit(1);
    }
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
