import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/roles";

const router = Router();

router.get("/my-tickets", authenticate, authorize("OFFICER"), async (req: AuthRequest, res, next) => {
  try {
    const tickets = await prisma.ticketAssignment.findMany({
      where: {
        officerId: req.user!.id,
      },
      orderBy: {
        assignedAt: "desc",
      },
      include: {
        ticket: {
          include: {
            createdBy: true,
            comments: true,
            history: true,
          },
        },
      },
    });

    return res.json(tickets);
  } catch (error) {
    next(error);
  }
});

export default router;
