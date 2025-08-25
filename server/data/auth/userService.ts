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
    ...input,
    password: hashedPassword,
    createdAt: new Date(),
  };

  const result = await db.collection<IUser>("users").insertOne(newUser);
  const withId = { ...newUser, _id: result.insertedId };

  // strip password before return
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safe } = withId;
  return safe;
}
