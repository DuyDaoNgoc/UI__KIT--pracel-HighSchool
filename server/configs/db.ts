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
  // Let the driver decide TLS for +srv URIs; set a few useful timeouts/pool limits
  tls: uri.startsWith("mongodb+srv"),
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 20,
});

let db: Db | undefined;

export async function connectDB(): Promise<Db> {
  if (!db) {
    // Try to connect with a few retries to handle transient network/DNS issues
    const maxAttempts = 5;
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        attempt += 1;
        console.log(`🔌 [connectDB] Attempt ${attempt} to connect to MongoDB`);

        // connect native driver
        await client.connect();
        db = client.db(process.env.MONGO_DB_NAME || "Duy04");
        console.log(
          `✅ MongoClient connected → ${process.env.MONGO_DB_NAME || "Duy04"}`,
        );

        // connect mongoose (so your mongoose models work)
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(uri, {
            dbName: process.env.MONGO_DB_NAME || "Duy04",
            // keep mongoose defaults; set family to 4 if your environment has IPv6 problems
            serverSelectionTimeoutMS: 10000,
          });
          console.log("✅ Mongoose connected");
        }

        break; // success
      } catch (err: any) {
        console.error(`❌ MongoDB connection attempt ${attempt} failed:`, err?.message || err);

        if (attempt >= maxAttempts) {
          console.error(
            "❌ MongoDB connection failed after multiple attempts.\n" +
              "Please check:\n" +
              " - your MONGO_URI in .env (SRV vs direct host)\n" +
              " - network/DNS access to the Atlas cluster\n" +
              " - IP whitelist (Atlas) or VPC settings\n",
          );
          // rethrow so caller can handle/shutdown
          throw err;
        }

        // Exponential backoff before retrying
        const backoffMs = Math.min(30000, 1000 * 2 ** attempt);
        console.log(`⏳ Waiting ${backoffMs}ms before next MongoDB connect attempt...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
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
    { unique: true, name: "uniq_username" },
  );

  console.log("✅ Indexes ensured (email, username)");
}
