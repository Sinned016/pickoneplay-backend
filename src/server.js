import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import { connectDB } from "./config/db.js";
import { disconnectDB } from "./config/db.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

config();
connectDB();

const app = express();

// Body parsing middlewares
app.use(express.json()); // Node.js and express servers don't know how to naturally handle json by defauly, so we need this.
app.use(express.urlencoded({ extended: true })); // Not fully required, this is used to parse data from an HTML form submission.

app.use(cookieParser());

// Cors
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

// API Routes
app.use("/auth", authRoutes);
app.use("/game", gameRoutes);

app.get("/hello", (req, res) => {
  res.json({ message: "Hello World" });
});

const PORT = 5001;
const server = app.listen(PORT, () => {
  console.log("Server running on port: " + PORT);
});

// Handle unhandled promise rejections (e.g., database connection errors)
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
