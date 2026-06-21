import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/roles";
import { createNotification } from "../services/notification.service";

const router = Router();

const createTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  imageUrl: z.url().optional(),
  locationText: z.string().optional(),
});

const assignTicketSchema = z.object({
  officerId: z.string().min(1),
});

const commentSchema = z.object({
  comment: z.string().min(1),
});

const statusSchema = z.object({
  status: z.enum(["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

router.get("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (req.user!.role === "ADMIN") {
      const tickets = await prisma.ticket.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: true,
          assignments: {
            include: {
              officer: true,
            },
          },
        },
      });

      return res.json(tickets);
    }

    if (req.user!.role === "CITIZEN") {
      const tickets = await prisma.ticket.findMany({
        where: {
          createdById: req.user!.id,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(tickets);
    }

    const assignments = await prisma.ticketAssignment.findMany({
      where: {
        officerId: req.user!.id,
      },
      orderBy: {
        assignedAt: "desc",
      },
      include: {
        ticket: true,
      },
    });

    return res.json(assignments);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, authorize("CITIZEN", "ADMIN"), async (req: AuthRequest, res, next) => {
  try {
    const data = createTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        imageUrl: data.imageUrl,
        locationText: data.locationText,
        createdById: req.user!.id,
      },
    });

    return res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const ticketId = getParam(req.params.id);

    if (!ticketId) {
      return res.status(400).json({
        message: "Ticket id is required",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: {
        createdBy: true,
        comments: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        history: {
          orderBy: {
            createdAt: "asc",
          },
        },
        assignments: {
          include: {
            officer: true,
          },
          orderBy: {
            assignedAt: "desc",
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (req.user!.role === "CITIZEN" && ticket.createdById !== req.user!.id) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (
      req.user!.role === "OFFICER" &&
      !ticket.assignments.some((assignment) => assignment.officerId === req.user!.id)
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    return res.json(ticket);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/assign", authenticate, authorize("ADMIN"), async (req: AuthRequest, res, next) => {
  try {
    const ticketId = getParam(req.params.id);
    const data = assignTicketSchema.parse(req.body);

    if (!ticketId) {
      return res.status(400).json({
        message: "Ticket id is required",
      });
    }

    const officer = await prisma.user.findUnique({
      where: {
        id: data.officerId,
      },
    });

    if (!officer || (officer.role !== "OFFICER" && officer.role !== "ADMIN")) {
      return res.status(400).json({
        message: "Officer not found",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const assignment = await prisma.ticketAssignment.create({
      data: {
        ticketId: ticket.id,
        officerId: officer.id,
      },
    });

    if (ticket.status !== "ASSIGNED") {
      await prisma.ticketStatusHistory.create({
        data: {
          ticketId: ticket.id,
          oldStatus: ticket.status,
          newStatus: "ASSIGNED",
          changedBy: req.user!.id,
        },
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        status: "ASSIGNED",
      },
    });

    // Send notification to assigned officer
    await createNotification(
      officer.id,
      "New Ticket Assigned",
      `Ticket "${ticket.title}" has been assigned to you`
    );

    // Notify ticket creator
    await createNotification(
      ticket.createdById,
      "Ticket Assigned",
      `Your ticket "${ticket.title}" has been assigned to an officer`
    );

    return res.json({
      message: "Assigned",
      assignment,
      ticket: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/comment", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const ticketId = getParam(req.params.id);
    const data = commentSchema.parse(req.body);

    if (!ticketId) {
      return res.status(400).json({
        message: "Ticket id is required",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: {
        assignments: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (req.user!.role === "CITIZEN" && ticket.createdById !== req.user!.id) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    if (
      req.user!.role === "OFFICER" &&
      !ticket.assignments.some((assignment) => assignment.officerId === req.user!.id)
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: ticket.id,
        userId: req.user!.id,
        comment: data.comment,
      },
    });

    return res.json(comment);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/status", authenticate, authorize("OFFICER", "ADMIN"), async (req: AuthRequest, res, next) => {
  try {
    const ticketId = getParam(req.params.id);
    const data = statusSchema.parse(req.body);

    if (!ticketId) {
      return res.status(400).json({
        message: "Ticket id is required",
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: {
        id: ticketId,
      },
      include: {
        assignments: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    if (
      req.user!.role === "OFFICER" &&
      !ticket.assignments.some((assignment) => assignment.officerId === req.user!.id)
    ) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: ticket.id,
        oldStatus: ticket.status,
        newStatus: data.status,
        changedBy: req.user!.id,
      },
    });

    const updatedTicket = await prisma.ticket.update({
      where: {
        id: ticket.id,
      },
      data: {
        status: data.status,
      },
    });

    // Send notification to ticket creator
    await createNotification(
      ticket.createdById,
      "Ticket Status Updated",
      `Your ticket "${ticket.title}" status changed to ${data.status.replace(/_/g, " ")}`
    );

    return res.json({
      message: "Updated",
      ticket: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
