const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const notificationRoutes = require("./routes/notifications");
const scheduleRoutes = require("./routes/schedules");
const requestRoutes = require("./routes/requests");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Tutor Management API",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/requests", requestRoutes);

module.exports = app;
