import { Response, Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", (req, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/"
  });
  res.status(200).json({ message: "Logged out successfully" });
});

router.get("/me", authenticate, getMe);

export const authRoutes = router;
