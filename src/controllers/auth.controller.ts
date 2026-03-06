import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateTokenAndSetCookie } from '../lib/jwt';

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword }
    });

    generateTokenAndSetCookie(res, user.id, user.username);

    res.status(201).json({ 
      message: "User created successfully",
      user: { id: user.id, username: user.username } 
    });
  } catch (error) {
    res.status(400).json({ error: "Username already exists or invalid data" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    generateTokenAndSetCookie(res, user.id, user.username);

    res.status(200).json({ 
      message: "Logged in successfully",
      user: { id: user.id, username: user.username } 
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { 
        id: true, 
        username: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error during auth check" });
  }
};