const express = require("express");
const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { verifyAuthToken } = require("../utils/jwt");

const router = express.Router();

function requireUser(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return null;
  }

  try {
    return verifyAuthToken(token);
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
    return null;
  }
}

router.get("/", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("notification_id, user_id, message, is_read, created_date")
    .eq("user_id", user.user_id)
    .order("created_date", { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ message: "Unable to load notifications" });
  return res.json({ notifications: data || [] });
});

router.patch("/read-all", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.user_id)
    .eq("is_read", false);

  if (error) return res.status(500).json({ message: "Unable to update notifications" });
  return res.json({ message: "Notifications marked as read" });
});

router.post("/self", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ message: "Notification message is required" });

  const { error } = await supabaseAdmin
    .from("notifications")
    .insert({ user_id: user.user_id, message, is_read: false });
  if (error) return res.status(500).json({ message: "Unable to create notification" });
  return res.status(201).json({ message: "Notification created" });
});

router.post("/managers", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  if (user.role !== "parent") return res.status(403).json({ message: "Only parents can notify managers" });

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ message: "Notification message is required" });

  const { data: managers, error: managersError } = await supabaseAdmin
    .from("managers")
    .select("user_id");
  if (managersError) return res.status(500).json({ message: "Unable to find managers" });

  const rows = (managers || []).map((manager) => ({
    user_id: manager.user_id,
    message,
    is_read: false,
  }));
  if (rows.length === 0) return res.json({ message: "No managers to notify" });

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) return res.status(500).json({ message: "Unable to create notification" });
  return res.status(201).json({ message: "Managers notified" });
});

router.post("/parent", async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  if (user.role !== "manager") return res.status(403).json({ message: "Only managers can notify parents" });

  const { parentId, message } = req.body || {};
  if (!parentId || !message) return res.status(400).json({ message: "Parent and notification message are required" });

  const { data: parent, error: parentError } = await supabaseAdmin
    .from("parents")
    .select("user_id")
    .eq("parent_id", parentId)
    .single();
  if (parentError || !parent) return res.status(404).json({ message: "Parent profile not found" });

  const { error } = await supabaseAdmin
    .from("notifications")
    .insert({ user_id: parent.user_id, message, is_read: false });
  if (error) return res.status(500).json({ message: "Unable to create notification" });
  return res.status(201).json({ message: "Parent notified" });
});

module.exports = router;
