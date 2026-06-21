import { prisma } from "../lib/prisma";

export async function createNotification(
  userId: string,
  title: string,
  message: string
) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });
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
