import { connectDB } from "../../configs/db";
import { IUser, CreateUserInput, SafeUser } from "../../types/user";
import bcrypt from "bcryptjs";

export async function findUserByEmail(email: string): Promise<IUser | null> {
  const db = await connectDB();
  return db.collection<IUser>("users").findOne({ email });
}

export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  const db = await connectDB();
  const hashedPassword = await bcrypt.hash(input.password, 10);

  const newUser: IUser = {
    username: input.username,
    email: input.email,
    password: hashedPassword,
    role: input.role,
    dob: input.dob,
    class: input.class,
    schoolYear: input.schoolYear,
    phone: input.phone,
    address: input.address,
    avatar:
      input.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png", // ✅ default avatar
    createdAt: input.createdAt ?? new Date(), // ✅ giữ nếu truyền vào, không thì tạo mới
  };

  const result = await db.collection<IUser>("users").insertOne(newUser);
  const withId = { ...newUser, _id: result.insertedId };

  // strip password before return
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safe } = withId;
  return safe;
}
