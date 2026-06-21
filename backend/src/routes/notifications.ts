import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { getUserNotifications, markAsRead, getUnreadCount } from "../services/notification.service";

const router = Router();

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// Get all notifications for current user
router.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const notifications = await getUserNotifications(req.user!.id);
    const unreadCount = await getUnreadCount(req.user!.id);

    return res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.post("/:id/read", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const notificationId = getParam(req.params.id);

    if (!notificationId) {
      return res.status(400).json({
        message: "Notification id is required",
      });
    }

    const notification = await markAsRead(notificationId);

    return res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get("/unread/count", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const unreadCount = await getUnreadCount(req.user!.id);

    return res.json({
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
