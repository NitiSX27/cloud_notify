import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";

const sqs = new SQSClient({ region: env.AWS_REGION });

export async function createNotification(
  userId: string,
  title: string,
  message: string
) {
  try {
    // 1. Save notification in database for the UI (synchronous)
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    // 2. Publish to SQS for email processing (asynchronous)
    if (env.AWS_SQS_QUEUE_URL) {
      await sqs.send(
        new SendMessageCommand({
          QueueUrl: env.AWS_SQS_QUEUE_URL,
          MessageBody: JSON.stringify({
            notificationId: notification.id,
            email: notification.user.email,
            name: notification.user.name,
            title,
            message,
          }),
        })
      );
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export async function markAsRead(notificationId: string) {
  try {
    return await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function getUserNotifications(userId: string) {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

export async function getUnreadCount(userId: string) {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
}
