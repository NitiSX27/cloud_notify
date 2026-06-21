import { createClient } from "redis";
import { env } from "../config/env";

export const redis = env.REDIS_URL
  ? createClient({ url: env.REDIS_URL })
  : null;

if (redis) {
  redis.on("error", (err) => console.error("Redis Client Error", err));
  redis.on("connect", () => console.log("Connected to Redis"));

  // Connect asynchronously without blocking startup
  redis.connect().catch(console.error);
}
