import { Response } from "express";
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!;

export const generateTokenAndSetCookie = (res: Response, userId: string, username: string) => {
  const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '1d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000,
    path: "/"
  });
};