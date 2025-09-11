// server/configs/db.ts
import { MongoClient, ServerApiVersion, Db } from "mongodb";
import mongoose from "mongoose";
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
  ssl: uri.startsWith("mongodb+srv"),
  tlsAllowInvalidCertificates: true,
});

let db: Db | undefined;

export async function connectDB(): Promise<Db> {
  if (!db) {
    try {
      // connect native driver
      await client.connect();
      db = client.db(process.env.MONGO_DB_NAME || "Duy04");
      console.log(
        `✅ MongoClient connected → ${process.env.MONGO_DB_NAME || "Duy04"}`
      );

      // connect mongoose (so your mongoose models work)
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri, {
          dbName: process.env.MONGO_DB_NAME || "Duy04",
          // mongoose v8 defaults are ok; you can set options if needed
        });
        console.log("✅ Mongoose connected");
      }
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err);
      process.exit(1);
    }
  }
  return db!;
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
