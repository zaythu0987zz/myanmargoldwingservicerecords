import express from "express";
import { COOKIE_NAME, decodeOAuthState } from "@shared/const";
import { getSessionCookieOptions, parseCookie } from "./cookies";
import { ENV } from "./env";
import { upsertUser } from "../db";

export function registerOAuthRoutes(app: express.Express) {
  app.get("/api/oauth/callback", async (req, res) => {
    try {
      const { code, state } = req.query;

      // CSRF guard: verify nonce matches cookie
      const { nonce } = decodeOAuthState(state as string);
      const cookies = parseCookie(req.headers.cookie ?? "");
      const expected = cookies["__Host-oauth_state"];

      if (!nonce || nonce !== expected) {
        res.status(403).json({ error: "invalid oauth state" });
        return;
      }
      res.clearCookie("__Host-oauth_state", { path: "/", secure: true, sameSite: "none" });

      // Exchange code for token
      const forgeApiUrl = ENV.builtInForgeApiUrl;
      const forgeApiKey = ENV.builtInForgeApiKey;

      if (!forgeApiUrl || !forgeApiKey) {
        console.error("[OAuth] Forge API credentials not configured");
        res.status(500).json({ error: "Server configuration error" });
        return;
      }

      const tokenResponse = await fetch(`${forgeApiUrl}/api/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${forgeApiKey}`,
        },
        body: JSON.stringify({
          code: code,
          state: state,
        }),
      });

      if (!tokenResponse.ok) {
        console.error("[OAuth] Token exchange failed:", await tokenResponse.text());
        res.status(401).json({ error: "Authentication failed" });
        return;
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch(`${forgeApiUrl}/api/oauth/me`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        res.status(401).json({ error: "Failed to get user info" });
        return;
      }

      const userInfo = await userResponse.json();

      // Upsert user in database
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: "manus",
        lastSignedIn: new Date(),
      });

      // Issue session JWT
      const { SignJWT } = await import("jose");
      const secret = new TextEncoder().encode(ENV.jwtSecret);
      const token = await new SignJWT({
        sub: String(userInfo.id || userInfo.openId),
        openId: userInfo.openId,
        name: userInfo.name,
        email: userInfo.email,
        loginMethod: "manus",
        role: userInfo.openId === ENV.ownerOpenId ? "admin" : "user",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(secret);

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, cookieOptions);
      res.redirect("/");
    } catch (error) {
      console.error("[OAuth] Callback error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
