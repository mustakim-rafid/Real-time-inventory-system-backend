import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { dropRoutes } from "./routes/drop.routes";
import cookieParser from "cookie-parser";
import { authRoutes } from "./routes/auth.routes";
import { initCleanupWorker } from "./workers/cleanup.worker";
import dotenv from "dotenv";

dotenv.config({
  path: "./.env"
});

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { 
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
});

initCleanupWorker(io);

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.set("io", io);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Real time inventory system",
  });
});

// Routes
app.use("/api/drops", dropRoutes);
app.use("/api/auth", authRoutes);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
