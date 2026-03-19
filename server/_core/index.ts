import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { resolve, join } from "path";
import { existsSync } from "fs";
import { ENV } from "./env";

import authRouter from "../routes/auth";
import adminRouter from "../routes/admin";
import clientRouter from "../routes/client";
import syncRouter from "../routes/sync";
import reportsRouter from "../routes/reports";

const app = express();

app.use(
  cors({
    origin: ENV.isProduction
      ? false
      : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/client", clientRouter);
app.use("/api/sync", syncRouter);
app.use("/api/reports", reportsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files from dist/public when available
const publicPath = resolve(process.cwd(), "dist/public");
if (existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get("*", (_req, res) => {
    res.sendFile(join(publicPath, "index.html"));
  });
}

app.listen(ENV.port, () => {
  console.log(`🚀 Server running on port ${ENV.port} [${ENV.nodeEnv}]`);
});

export default app;
