import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "./lib/logger";

import healthRoutes from "./routes/health";
import uploadRoutes from "./routes/uploads";
import ticketRoutes from "./routes/tickets";
import authRoutes from "./routes/auth";
import officerRoutes from "./routes/officer";
import notificationRoutes from "./routes/notifications";
import adminRoutes from "./routes/admin";

const app = express();

// CORS must come BEFORE helmet so preflight OPTIONS requests are handled correctly
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      process.env.FRONTEND_URL || "",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));


app.use("/api/health", healthRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/officer", officerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error(err);
  res.status(500).json({
    message: "Internal server error"
  });
});

export default app;
