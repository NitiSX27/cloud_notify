import type { NextFunction, Response } from "express";
import type { Role } from "../generated/prisma/client";
import type { AuthRequest } from "./auth";

export function authorize(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
}
