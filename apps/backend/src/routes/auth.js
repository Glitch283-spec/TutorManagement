const express = require("express");
const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { verifyPassword } = require("../utils/password");
const { signAuthToken, verifyAuthToken } = require("../utils/jwt");
const { getProfileByUserId } = require("../services/profileService");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const normalizedEmail = email.trim();

    const { data: appUser, error } = await supabaseAdmin
      .from("users")
      .select("user_id, email, password, status, role")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("Login query error:", error);
      return res.status(500).json({ message: "Unable to verify credentials" });
    }

    if (!appUser) {
      return res.status(401).json({ message: "Invalid login credentials" });
    }

    if ((appUser.status || "active") !== "active") {
      return res.status(403).json({ message: "Your account is not active" });
    }

    const passwordValid = await verifyPassword(password, appUser.password);
    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid login credentials" });
    }

    const profile = await getProfileByUserId(appUser.user_id);
    if (!profile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const token = signAuthToken({
      user_id: appUser.user_id,
      email: appUser.email,
      role: appUser.role,
    });

    return res.json({
      token,
      user: {
        id: String(appUser.user_id),
        email: appUser.email,
      },
      profile,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const payload = verifyAuthToken(token);
    const profile = await getProfileByUserId(payload.user_id);

    if (!profile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res.json({
      user: {
        id: String(profile.user_id),
        email: profile.email,
      },
      profile,
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

module.exports = router;
