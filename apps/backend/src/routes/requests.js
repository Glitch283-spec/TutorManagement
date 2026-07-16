const express = require("express");
const { supabaseAdmin } = require("../lib/supabaseAdmin");
const { verifyAuthToken } = require("../utils/jwt");

const router = express.Router();

function requireManager(req, res) {
  const value = req.headers.authorization || "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return null;
  }

  try {
    const user = verifyAuthToken(token);
    if (user.role !== "manager") {
      res.status(403).json({ message: "Manager access is required" });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
    return null;
  }
}

router.get("/", async (req, res) => {
  if (!requireManager(req, res)) return;

  const { data: requests, error: requestsError } = await supabaseAdmin
    .from("learning_requests")
    .select("*")
    .order("created_date", { ascending: false });
  if (requestsError) return res.status(500).json({ message: "Unable to load learning requests" });

  const parentIds = [...new Set((requests || []).map((request) => request.parent_id))];
  const { data: parents, error: parentsError } = parentIds.length
    ? await supabaseAdmin.from("parents").select("parent_id, user_id").in("parent_id", parentIds)
    : { data: [], error: null };
  if (parentsError) return res.status(500).json({ message: "Unable to load request parents" });

  const userIds = [...new Set((parents || []).map((parent) => parent.user_id))];
  const { data: users, error: usersError } = userIds.length
    ? await supabaseAdmin.from("users").select("user_id, full_name, email").in("user_id", userIds)
    : { data: [], error: null };
  if (usersError) return res.status(500).json({ message: "Unable to load parent profiles" });

  const parentToUser = new Map((parents || []).map((parent) => [parent.parent_id, parent.user_id]));
  const userById = new Map((users || []).map((user) => [user.user_id, user]));
  const result = (requests || []).map((request) => {
    const parent = userById.get(parentToUser.get(request.parent_id));
    return {
      ...request,
      parent_name: parent?.full_name || "Unknown Parent",
      parent_email: parent?.email || "-",
    };
  });

  return res.json({ requests: result });
});

module.exports = router;
