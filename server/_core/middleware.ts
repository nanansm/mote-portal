import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./auth";
import type { JwtPayload } from "../../shared/types";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  req.user = payload;
  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}
