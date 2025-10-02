import { connectDB } from "../../configs/db";
import { IUser, CreateUserInput, SafeUser, toSafeUser } from "../../types/user";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// ===================== Tìm user theo email =====================
export async function findUserByEmail(email: string): Promise<IUser | null> {
  const db = await connectDB();
  return db.collection<IUser>("users").findOne({ email });
}

// ===================== Tạo user mới =====================
export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  if (!input.password) throw new Error("Password is required");

  const db = await connectDB();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  const newUser: Omit<IUser, "_id"> = {
    studentId: input.studentId ?? "",
    teacherId: input.teacherId ?? "", // ✅ lưu teacherId nếu có
    parentId: input.parentId ?? null,
    customId: input.customId ?? "",
    username: input.username,
    email: input.email,
    password: hashedPassword,
    role: input.role ?? (input.teacherId ? "teacher" : "student"), // role tự động teacher nếu teacherId
    dob: input.dob ?? "",
    class: input.class ?? "",
    schoolYear: input.schoolYear ?? "",
    phone: input.phone ?? "",
    address: input.address ?? "",
    avatar:
      input.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    createdAt: new Date(),
    children: (input.children ?? []).map((id) => new ObjectId(id)),
    grades: input.grades ?? [],
    creditsTotal: input.creditsTotal ?? 0,
    creditsEarned: input.creditsEarned ?? 0,
    schedule: input.schedule ?? [],
    tuitionTotal: input.tuitionTotal ?? 0,
    tuitionPaid: input.tuitionPaid ?? 0,
    tuitionRemaining: input.tuitionRemaining ?? 0,
    // Trường để quản lý khóa login
    loginAttempts: 0,
    lockUntil: 0,
  };

  const result = await db.collection<IUser>("users").insertOne(newUser);

  const userWithId: IUser & { _id: ObjectId } = {
    ...newUser,
    _id: result.insertedId as ObjectId,
  };
  return toSafeUser(userWithId);
}

// ===================== Cập nhật user theo ID =====================
export async function updateUserById(
  id: string | ObjectId,
  update: Partial<IUser>
) {
  const db = await connectDB();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  await db.collection<IUser>("users").updateOne({ _id }, { $set: update });
}
