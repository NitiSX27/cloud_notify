import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import dotenv from "dotenv";

dotenv.config();

const sqs = new SQSClient({ region: env.AWS_REGION });
const ses = new SESClient({ region: env.AWS_REGION });

async function processMessage(message: any) {
  if (!message.Body) return;
  const payload = JSON.parse(message.Body);

  logger.info(`Processing notification for ${payload.email}...`);

  if (!env.SES_FROM_EMAIL) {
    logger.warn("SES_FROM_EMAIL not configured. Skipping email send.");
    return;
  }

  const emailParams = {
    Destination: {
      ToAddresses: [payload.email],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #4f46e5;">CivicConnect Update</h2>
              <p>Hello <strong>${payload.name}</strong>,</p>
              <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #4f46e5; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e293b;">${payload.title}</h3>
                <p style="margin-bottom: 0; color: #475569;">${payload.message}</p>
              </div>
              <p style="color: #64748b; font-size: 13px;">Login to your dashboard to view more details.</p>
            </div>
          `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `CivicConnect: ${payload.title}`,
      },
    },
    Source: env.SES_FROM_EMAIL,
  };

  await ses.send(new SendEmailCommand(emailParams));
  logger.info(`Email successfully sent to ${payload.email}`);
}

async function pollQueue() {
  if (!env.AWS_SQS_QUEUE_URL) {
    logger.error("AWS_SQS_QUEUE_URL is not set. Worker cannot start.");
    process.exit(1);
  }

  logger.info("Worker started. Listening for messages...");

  while (true) {
    try {
      const response = await sqs.send(
        new ReceiveMessageCommand({
          QueueUrl: env.AWS_SQS_QUEUE_URL,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20, // Long polling
        })
      );

      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          try {
            await processMessage(message);

            // Delete message after successful processing
            await sqs.send(
              new DeleteMessageCommand({
                QueueUrl: env.AWS_SQS_QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle!,
              })
            );
          } catch (err) {
            logger.error("Error processing individual message:", err);
            // Don't delete, let it go to Dead Letter Queue (DLQ) if configured
          }
        }
      }
    } catch (err) {
      logger.error("Error polling SQS:", err);
      // Wait before retrying to prevent throttling
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

pollQueue();
