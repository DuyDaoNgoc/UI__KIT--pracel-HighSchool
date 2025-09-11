import { connectDB } from "../../configs/db";
import { IUser, CreateUserInput, SafeUser, toSafeUser } from "../../types/user";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function findUserByEmail(email: string): Promise<IUser | null> {
  const db = await connectDB();
  return db.collection<IUser>("users").findOne({ email });
}

export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  const db = await connectDB();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  const newUser: IUser = {
    customId: input.customId,
    username: input.username,
    email: input.email,
    password: hashedPassword,
    role: input.role ?? "student", // ✅ default nếu không truyền
    dob: input.dob,
    class: input.class,
    schoolYear: input.schoolYear,
    phone: input.phone,
    address: input.address,
    avatar:
      input.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    createdAt: new Date(),
    children: input.children?.map((id) => new ObjectId(id)) || [], // ✅ convert string[] → ObjectId[]
  };

  const result = await db.collection<IUser>("users").insertOne(newUser);

  // ✅ convert sang SafeUser trước khi trả về
  return toSafeUser({ ...newUser, _id: result.insertedId });
}
