"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.ensureIndexes = ensureIndexes;
// server/configs/db.ts
const mongodb_1 = require("mongodb");
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error("❌ Missing MONGO_URI in .env");
}
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    ssl: uri.startsWith("mongodb+srv"),
    tlsAllowInvalidCertificates: true,
});
let db;
async function connectDB() {
    if (!db) {
        try {
            // connect native driver
            await client.connect();
            db = client.db(process.env.MONGO_DB_NAME || "Duy04");
            console.log(`✅ MongoClient connected → ${process.env.MONGO_DB_NAME || "Duy04"}`);
            // connect mongoose (so your mongoose models work)
            if (mongoose_1.default.connection.readyState === 0) {
                await mongoose_1.default.connect(uri, {
                    dbName: process.env.MONGO_DB_NAME || "Duy04",
                    // mongoose v8 defaults are ok; you can set options if needed
                });
                console.log("✅ Mongoose connected");
            }
        }
        catch (err) {
            console.error("❌ MongoDB connection failed:", err);
            process.exit(1);
        }
    }
    return db;
}
async function ensureIndexes() {
    const database = await connectDB();
    const users = database.collection("users");
    await users.createIndex({ email: 1 }, { unique: true, name: "uniq_email" });
    await users.createIndex({ username: 1 }, { unique: true, name: "uniq_username" });
    console.log("✅ Indexes ensured (email, username)");
}
