import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
import { env } from "../config/env";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${message} ${stack ? `\n${stack}` : ""}`;
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [
    // Always log to console
    new winston.transports.Console({
      format: env.NODE_ENV === "production" ? logFormat : consoleFormat,
    }),
  ],
});

// Add CloudWatch transport in production if configured
if (env.NODE_ENV === "production" && env.AWS_REGION) {
  logger.add(
    new WinstonCloudWatch({
      logGroupName: "community-platform/backend",
      logStreamName: `ecs-${process.env.HOSTNAME || "backend-service"}`,
      awsRegion: env.AWS_REGION,
      jsonMessage: true,
    })
  );
}
