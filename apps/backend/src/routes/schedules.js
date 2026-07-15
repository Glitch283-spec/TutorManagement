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

function requireTutor(req, res) {
  const value = req.headers.authorization || "";
  const token = value.startsWith("Bearer ") ? value.slice(7) : null;
  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return null;
  }
  try {
    const user = verifyAuthToken(token);
    if (user.role !== "tutor") {
      res.status(403).json({ message: "Tutor access is required" });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
    return null;
  }
}

const normalizeDay = (value) => String(value || "").trim().toLowerCase().slice(0, 3);
const dayFromDate = (date) => ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(`${date}T12:00:00`).getDay()];
const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

async function getPlanningData(classId) {
  const { data: lessonClass, error: classError } = await supabaseAdmin
    .from("classes")
    .select("class_id, assignment_id, class_name, start_date, end_date, status")
    .eq("class_id", classId)
    .single();
  if (classError || !lessonClass) return { error: "Class not found" };

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("assignments")
    .select("assignment_id, tutor_id, request_id")
    .eq("assignment_id", lessonClass.assignment_id)
    .single();
  if (assignmentError || !assignment) return { error: "Class assignment not found" };

  const [{ data: tutor }, { data: request }, { data: availability }, { data: leaves }, { data: allClasses }, { data: allAssignments }, { data: allSchedules }] = await Promise.all([
    supabaseAdmin.from("tutors").select("tutor_id, user_id").eq("tutor_id", assignment.tutor_id).single(),
    supabaseAdmin.from("learning_requests").select("request_id, parent_id, student_name, subject").eq("request_id", assignment.request_id).single(),
    supabaseAdmin.from("availability_slots").select("slot_id, day_of_week, start_time, end_time, status").eq("tutor_id", assignment.tutor_id),
    supabaseAdmin.from("leave_requests").select("leave_request_id, start_date, end_date, status").eq("tutor_id", assignment.tutor_id),
    supabaseAdmin.from("classes").select("class_id, assignment_id, class_name"),
    supabaseAdmin.from("assignments").select("assignment_id, tutor_id"),
    supabaseAdmin.from("teaching_schedules").select("schedule_id, class_id, teaching_date, start_time, end_time, location, learning_method, status, confirmation_status, confirmation_reason, confirmed_date"),
  ]);
  if (!tutor || !request) return { error: "Tutor or parent information is missing" };

  const classById = new Map((allClasses || []).map((item) => [item.class_id, item]));
  const assignmentById = new Map((allAssignments || []).map((item) => [item.assignment_id, item]));
  const tutorSchedules = (allSchedules || []).filter((schedule) => {
    const scheduleClass = classById.get(schedule.class_id);
    return scheduleClass && assignmentById.get(scheduleClass.assignment_id)?.tutor_id === assignment.tutor_id;
  }).map((schedule) => ({ ...schedule, class_name: classById.get(schedule.class_id)?.class_name || "Class" }));

  return {
    lessonClass,
    assignment,
    tutor,
    request,
    availability: availability || [],
    leaves: leaves || [],
    tutorSchedules,
  };
}

function validateSchedule(data, input, currentScheduleId) {
  const { teachingDate, startTime, endTime } = input;
  if (!teachingDate || !startTime || !endTime) return "Date, start time and end time are required";
  if (startTime >= endTime) return "End time must be later than start time";

  const dateDay = dayFromDate(teachingDate);
  const available = data.availability.some((slot) =>
    (slot.status || "available").toLowerCase() === "available" &&
    normalizeDay(slot.day_of_week) === dateDay &&
    startTime >= slot.start_time && endTime <= slot.end_time
  );
  if (!available) return "Selected time is outside the tutor's availability";

  const leave = data.leaves.find((item) =>
    (item.status || "").toLowerCase() === "approved" &&
    teachingDate >= item.start_date && teachingDate <= item.end_date
  );
  if (leave) return "Tutor is on approved leave on the selected date";

  const conflict = data.tutorSchedules.find((item) =>
    item.schedule_id !== currentScheduleId &&
    item.teaching_date === teachingDate &&
    overlaps(startTime, endTime, item.start_time, item.end_time)
  );
  if (conflict) return `Tutor has a schedule conflict with ${conflict.class_name} (${conflict.start_time}–${conflict.end_time})`;
  return null;
}

router.get("/classes", async (req, res) => {
  if (!requireManager(req, res)) return;
  const { data: classes, error } = await supabaseAdmin
    .from("classes")
    .select("class_id, assignment_id, class_name, start_date, end_date, status")
    .order("class_id", { ascending: false });
  if (error) return res.status(500).json({ message: "Unable to load classes" });
  return res.json({ classes: classes || [] });
});

router.get("/classes/:classId", async (req, res) => {
  if (!requireManager(req, res)) return;
  const data = await getPlanningData(Number(req.params.classId));
  if (data.error) return res.status(404).json({ message: data.error });
  return res.json(data);
});

async function saveSchedule(req, res, scheduleId) {
  if (!requireManager(req, res)) return;
  const { classId, teachingDate, startTime, endTime, location, learningMethod } = req.body || {};
  if (scheduleId) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("teaching_schedules")
      .select("confirmation_status")
      .eq("schedule_id", scheduleId)
      .single();
    if (existingError || !existing) return res.status(404).json({ message: "Teaching schedule not found" });
    if ((existing.confirmation_status || "pending") !== "pending") {
      return res.status(409).json({ message: "A confirmed session is locked and cannot be edited" });
    }
  }
  const data = await getPlanningData(Number(classId));
  if (data.error) return res.status(404).json({ message: data.error });
  const problem = validateSchedule(data, { teachingDate, startTime, endTime }, scheduleId);
  if (problem) return res.status(422).json({ message: problem });

  const payload = {
    class_id: data.lessonClass.class_id,
    teaching_date: teachingDate,
    start_time: startTime,
    end_time: endTime,
    location: location || null,
    learning_method: learningMethod || null,
    status: "active",
  };
  const query = scheduleId
    ? supabaseAdmin.from("teaching_schedules").update(payload).eq("schedule_id", scheduleId)
    : supabaseAdmin.from("teaching_schedules").insert(payload);
  const { data: schedule, error } = await query.select().single();
  if (error) return res.status(500).json({ message: "Unable to save teaching schedule" });

  const { data: parent } = await supabaseAdmin
    .from("parents").select("user_id").eq("parent_id", data.request.parent_id).single();
  const message = `${data.lessonClass.class_name || "Class"} is scheduled for ${teachingDate}, ${startTime}–${endTime}.`;
  const rows = [data.tutor.user_id, parent?.user_id].filter(Boolean).map((user_id) => ({ user_id, message, is_read: false }));
  if (rows.length) await supabaseAdmin.from("notifications").insert(rows);
  return res.status(scheduleId ? 200 : 201).json({ schedule });
}

router.post("/", (req, res) => saveSchedule(req, res, null));
router.patch("/:scheduleId", (req, res) => saveSchedule(req, res, Number(req.params.scheduleId)));

router.get("/tutor/sessions", async (req, res) => {
  const user = requireTutor(req, res);
  if (!user) return;
  const { data: tutor, error: tutorError } = await supabaseAdmin
    .from("tutors").select("tutor_id").eq("user_id", user.user_id).single();
  if (tutorError || !tutor) return res.status(404).json({ message: "Tutor profile not found" });

  const [{ data: assignments }, { data: classes }, { data: schedules, error }] = await Promise.all([
    supabaseAdmin.from("assignments").select("assignment_id, tutor_id").eq("tutor_id", tutor.tutor_id),
    supabaseAdmin.from("classes").select("class_id, assignment_id, class_name"),
    supabaseAdmin.from("teaching_schedules").select("schedule_id, class_id, teaching_date, start_time, end_time, location, learning_method, status, confirmation_status, confirmation_reason, confirmed_date").order("teaching_date", { ascending: true }),
  ]);
  if (error) return res.status(500).json({ message: "Unable to load teaching sessions" });
  const assignmentIds = new Set((assignments || []).map((item) => item.assignment_id));
  const classById = new Map((classes || []).map((item) => [item.class_id, item]));
  const sessions = (schedules || []).filter((item) => assignmentIds.has(classById.get(item.class_id)?.assignment_id))
    .map((item) => ({ ...item, class_name: classById.get(item.class_id)?.class_name || "Class" }));
  return res.json({ sessions });
});

router.patch("/tutor/sessions/:scheduleId/confirmation", async (req, res) => {
  const user = requireTutor(req, res);
  if (!user) return;
  const { confirmationStatus, reason } = req.body || {};
  if (!["completed", "postponed"].includes(confirmationStatus)) {
    return res.status(400).json({ message: "Confirmation status must be completed or postponed" });
  }
  if (confirmationStatus === "postponed" && !String(reason || "").trim()) {
    return res.status(400).json({ message: "A postponement reason is required" });
  }

  const { data: tutor } = await supabaseAdmin.from("tutors").select("tutor_id").eq("user_id", user.user_id).single();
  const { data: schedule, error: scheduleError } = await supabaseAdmin
    .from("teaching_schedules")
    .select("schedule_id, class_id, confirmation_status")
    .eq("schedule_id", req.params.scheduleId).single();
  if (scheduleError || !schedule || !tutor) return res.status(404).json({ message: "Teaching session not found" });
  if ((schedule.confirmation_status || "pending") !== "pending") {
    return res.status(409).json({ message: "This session has already been confirmed and cannot be changed" });
  }
  const { data: lessonClass } = await supabaseAdmin.from("classes").select("assignment_id, class_name").eq("class_id", schedule.class_id).single();
  const { data: assignment } = await supabaseAdmin.from("assignments").select("tutor_id, request_id").eq("assignment_id", lessonClass?.assignment_id).single();
  if (!assignment || assignment.tutor_id !== tutor.tutor_id) return res.status(403).json({ message: "This session is not assigned to you" });

  const { data, error } = await supabaseAdmin.from("teaching_schedules").update({
    status: confirmationStatus,
    confirmation_status: confirmationStatus,
    confirmation_reason: confirmationStatus === "postponed" ? String(reason).trim() : null,
    confirmed_date: new Date().toISOString(),
  }).eq("schedule_id", schedule.schedule_id).select().single();
  if (error) return res.status(500).json({ message: "Unable to save session confirmation" });

  if (confirmationStatus === "postponed") {
    const { error: requestStatusError } = await supabaseAdmin
      .from("learning_requests")
      .update({ status: "postponed" })
      .eq("request_id", assignment.request_id);
    if (requestStatusError) {
      console.error("Learning request postponement status error:", requestStatusError);
      return res.status(500).json({ message: "Session was postponed, but the learning request status could not be updated" });
    }
  }

  const managerMessage = confirmationStatus === "completed"
    ? `Tutor confirmed the session for ${lessonClass.class_name || "a class"} on the salary record as completed.`
    : `Tutor postponed the session for ${lessonClass.class_name || "a class"}. Reason: ${String(reason).trim()}`;
  const { data: managers } = await supabaseAdmin.from("managers").select("user_id");
  const notificationRows = (managers || []).map((manager) => ({ user_id: manager.user_id, message: managerMessage, is_read: false }));
  if (notificationRows.length) {
    const { error: notificationError } = await supabaseAdmin.from("notifications").insert(notificationRows);
    if (notificationError) console.error("Session confirmation notification error:", notificationError);
  }
  return res.json({ session: data });
});

module.exports = router;
