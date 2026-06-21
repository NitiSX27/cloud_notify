import { createClient } from "redis";
import { env } from "../config/env";
import { logger } from "./logger";

export const redis = env.REDIS_URL
  ? createClient({ url: env.REDIS_URL })
  : null;

if (redis) {
  redis.on("error", (err) => logger.error("Redis Client Error", err));
  redis.on("connect", () => logger.info("Connected to Redis"));

  // Connect asynchronously without blocking startup
  redis.connect().catch(logger.error);
}
