import { Request, Response } from "express";
import { AuthService } from "../services/authService.js";
import { RegisterUserInput } from "../types/registerUserInput.js";
import { LoginUserInput } from "../types/loginUserInput.js";
import { AuthResponse } from "../types/authResponse.js";

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password }: RegisterUserInput = req.body;
    const user = await authService.registerUser(username, email, password);
    res.status(201).json({ message: "User registered", userId: user.id });
  } catch (error) {
    res.status(400).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginUserInput = req.body;
    const result = await authService.loginUser(email, password);
    if (result) {
      res.json(result);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(400).json({ error: "Login failed" });
  }
};