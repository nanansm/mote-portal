import { Router } from "express";
import { nanoid } from "nanoid";
import { eq, and, isNull } from "drizzle-orm";
import { getGoogleAuthUrl, getGoogleProfile, signJwt } from "../_core/auth";
import { getDb, schema } from "../_core/db";
import { ENV } from "../_core/env";
import { requireAuth } from "../_core/middleware";

const router = Router();

router.get("/google", (_req, res) => {
  const url = getGoogleAuthUrl();
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).json({ error: "Missing code" });
      return;
    }

    const profile = await getGoogleProfile(code);
    const db = getDb();

    // Upsert user
    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.googleId, profile.googleId))
      .limit(1);

    let user = existing[0];

    if (!user) {
      const userId = nanoid();
      await db.insert(schema.users).values({
        id: userId,
        googleId: profile.googleId,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        role: "client",
        lastSignedIn: new Date(),
      });
      const created = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);
      user = created[0];
    } else {
      await db
        .update(schema.users)
        .set({ lastSignedIn: new Date(), name: profile.name, avatar: profile.avatar })
        .where(eq(schema.users.id, user.id));
    }

    // Link client record to this user if contactEmail matches and userId is not yet set
    if (user.role !== "admin") {
      await db
        .update(schema.clients)
        .set({ userId: user.id })
        .where(
          and(
            eq(schema.clients.contactEmail, user.email),
            isNull(schema.clients.userId)
          )
        );
    }

    const token = await signJwt({
      userId: user.id,
      email: user.email,
      role: user.role as "admin" | "client",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: ENV.isProduction,
      sameSite: ENV.isProduction ? "strict" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Check if client user has an associated client profile
    if (user.role === "client") {
      const clientProfile = await db
        .select({ id: schema.clients.id })
        .from(schema.clients)
        .where(eq(schema.clients.userId, user.id))
        .limit(1);

      if (!clientProfile[0]) {
        // No client profile found — redirect with access error
        const errorUrl = ENV.isProduction ? "/login?error=noaccess" : "http://localhost:5173/login?error=noaccess";
        res.redirect(errorUrl);
        return;
      }
    }

    const redirectUrl = ENV.isProduction ? "/" : "http://localhost:5173/";
    res.redirect(redirectUrl);
  } catch (err) {
    console.error("OAuth callback error:", err);
    const redirectUrl = ENV.isProduction ? "/login?error=oauth" : "http://localhost:5173/login?error=oauth";
    res.redirect(redirectUrl);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.user!.userId))
      .limit(1);

    if (!users[0]) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = users[0];
    res.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        lastSignedIn: user.lastSignedIn,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
