import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import { hash, compare } from "bcryptjs";
import { createUser, getUserByEmail } from "../db/db.js";

export class AuthService {
  async registerUser(
    username: string,
    email: string,
    password: string
  ): Promise<User> {
    const hashedPass = await hash(password, 10);
    const newUser = createUser(username, email, hashedPass) as User;
    return newUser;
  }

  async loginUser(email: string, password: string): Promise<{ token: string; userId: number } | null> {
    const user = getUserByEmail(email) as User | null;
    if (user && (await compare(password, user.passHash))) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "default", {
        expiresIn: "1h",
      });
      return { token, userId: user.id };
    }
    return null;
  }
}
