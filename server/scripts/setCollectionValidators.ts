import dotenv from "dotenv";
import { connectDB } from "../configs/db";

dotenv.config();

async function setValidators() {
  const db = await connectDB();

  const usersValidator = {
    $jsonSchema: {
      bsonType: "object",
      required: ["username", "role"],
      properties: {
        _id: { bsonType: "objectId" },
        studentId: { bsonType: ["string", "null"] },
        teacherId: { bsonType: ["string", "null"] },
        parentId: { bsonType: ["string", "null"] },
        customId: { bsonType: ["string", "null"] },
        username: { bsonType: "string" },
        email: { bsonType: ["string", "null"] },
        password: { bsonType: ["string", "null"] },
        role: { enum: ["student", "teacher", "admin", "parent"] },
        dob: { bsonType: ["date", "null"] },
        classCode: { bsonType: ["string", "null"] },
        major: { bsonType: ["string", "null"] },
        schoolYear: { bsonType: ["string", "null"] },
        phone: { bsonType: ["string", "null"] },
        address: { bsonType: ["string", "null"] },
        avatar: { bsonType: ["string", "null"] },
        children: { bsonType: ["array"] },
        grades: { bsonType: ["array"] },
        schedule: { bsonType: ["array"] },
        assignedClass: { bsonType: ["array"] },
        creditsTotal: { bsonType: ["number", "null"] },
        creditsEarned: { bsonType: ["number", "null"] },
        tuitionTotal: { bsonType: ["number", "null"] },
        tuitionPaid: { bsonType: ["number", "null"] },
        tuitionRemaining: { bsonType: ["number", "null"] },
        isBlocked: { bsonType: ["bool", "null"] },
        loginAttempts: { bsonType: ["number", "null"] },
        lockUntil: { bsonType: ["number", "null"] },
        createdAt: { bsonType: ["date", "null"] },
        updatedAt: { bsonType: ["date", "null"] },
      },
    },
  } as any;

  try {
    console.log(
      "📝 Applying validator to collection 'users' (validationLevel: moderate)...",
    );
    await db.command({
      collMod: "users",
      validator: usersValidator,
      validationLevel: "moderate",
    });
    console.log("✅ Validator successfully applied to 'users' collection");
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn(
      `⚠️ collMod failed (${errMsg}), attempting createCollection fallback...`,
    );
    try {
      const exists =
        (await db.listCollections({ name: "users" }).toArray()).length > 0;
      if (!exists) {
        console.log("Creating 'users' collection with validator...");
        await db.createCollection("users", { validator: usersValidator });
        console.log("✅ Created 'users' collection with validator");
      } else {
        console.error(
          "❌ Could not apply validator via collMod; check MongoDB permissions or version.",
        );
        process.exit(1);
      }
    } catch (e: any) {
      console.error(
        "❌ Failed to create collection with validator:",
        e?.message || e,
      );
      process.exit(1);
    }
  }
  console.log("✅ All validators configured successfully!");
  process.exit(0);
}

setValidators().catch((e) => {
  console.error("❌ Error running setCollectionValidators:", e?.message || e);
  process.exit(1);
});
