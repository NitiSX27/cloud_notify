import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/roles";
import { redis } from "../lib/redis";

const router = Router();

// Admin dashboard statistics
router.get("/stats", authenticate, authorize("ADMIN"), async (req: AuthRequest, res, next) => {
  try {
    // Check cache first
    const cacheKey = "admin:stats";
    if (redis) {
      const cachedStats = await redis.get(cacheKey);
      if (cachedStats) {
        return res.json(JSON.parse(cachedStats));
      }
    }

    // Ticket statistics
    const totalTickets = await prisma.ticket.count();

    const openTickets = await prisma.ticket.count({
      where: {
        status: "OPEN",
      },
    });

    const assignedTickets = await prisma.ticket.count({
      where: {
        status: "ASSIGNED",
      },
    });

    const inProgressTickets = await prisma.ticket.count({
      where: {
        status: "IN_PROGRESS",
      },
    });

    const resolvedTickets = await prisma.ticket.count({
      where: {
        status: "RESOLVED",
      },
    });

    const closedTickets = await prisma.ticket.count({
      where: {
        status: "CLOSED",
      },
    });

    // User statistics
    const totalUsers = await prisma.user.count();

    const citizenCount = await prisma.user.count({
      where: {
        role: "CITIZEN",
      },
    });

    const officerCount = await prisma.user.count({
      where: {
        role: "OFFICER",
      },
    });

    const adminCount = await prisma.user.count({
      where: {
        role: "ADMIN",
      },
    });

    // Assignment statistics
    const totalAssignments = await prisma.ticketAssignment.count();

    // Comment statistics
    const totalComments = await prisma.ticketComment.count();

    // Priority distribution
    const lowPriority = await prisma.ticket.count({
      where: {
        priority: "LOW",
      },
    });

    const mediumPriority = await prisma.ticket.count({
      where: {
        priority: "MEDIUM",
      },
    });

    const highPriority = await prisma.ticket.count({
      where: {
        priority: "HIGH",
      },
    });

    const urgentPriority = await prisma.ticket.count({
      where: {
        priority: "URGENT",
      },
    });

    // Category distribution (top 5)
    const categoryStats = await prisma.ticket.groupBy({
      by: ["category"],
      _count: true,
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Average resolution time (in days)
    const resolvedTicketsWithDates = await prisma.ticket.findMany({
      where: {
        status: "RESOLVED",
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const avgResolutionTime =
      resolvedTicketsWithDates.length > 0
        ? resolvedTicketsWithDates.reduce((acc, ticket) => {
            const diff = new Date(ticket.updatedAt).getTime() - new Date(ticket.createdAt).getTime();
            return acc + diff / (1000 * 60 * 60 * 24); // Convert to days
          }, 0) / resolvedTicketsWithDates.length
        : 0;

    const payload = {
      tickets: {
        total: totalTickets,
        status: {
          open: openTickets,
          assigned: assignedTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
        },
        priority: {
          low: lowPriority,
          medium: mediumPriority,
          high: highPriority,
          urgent: urgentPriority,
        },
        avgResolutionDays: Math.round(avgResolutionTime * 100) / 100,
      },
      users: {
        total: totalUsers,
        roles: {
          citizen: citizenCount,
          officer: officerCount,
          admin: adminCount,
        },
      },
      assignments: {
        total: totalAssignments,
      },
      comments: {
        total: totalComments,
      },
      categories: categoryStats.map((cat) => ({
        name: cat.category,
        count: cat._count,
      })),
    };

    // Save to cache (e.g. 60 seconds)
    if (redis) {
      await redis.setEx(cacheKey, 60, JSON.stringify(payload));
    }

    return res.json(payload);
  } catch (error) {
    next(error);
  }
});

// Get all officers (for assignment)
router.get("/officers", authenticate, authorize("ADMIN"), async (_req: AuthRequest, res, next) => {
  try {
    const officers = await prisma.user.findMany({
      where: {
        role: { in: ["OFFICER", "ADMIN"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json(officers);
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get("/users", authenticate, authorize("ADMIN"), async (_req: AuthRequest, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;

