// Starts the Express server, connects MongoDB, and mounts all API routes.
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./src/config/db");

const authRoutes = require("./src/routes/auth.routes");
const jobRoutes = require("./src/routes/job.routes");
const applicationRoutes = require("./src/routes/application.routes");
const noticeRoutes = require("./src/routes/notice.routes");
const studentRoutes = require("./src/routes/student.routes");
const driveRoutes = require("./src/routes/drive.routes");
const interviewRoutes = require("./src/routes/interview.routes");
const placementRoutes = require("./src/routes/placement.routes");

const { notFound, errorHandler } = require("./src/middleware/error.middleware");

const app = express();
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));
}

app.get("/", (req, res) => {
  if (hasFrontendBuild) {
    return res.sendFile(frontendIndexPath);
  }
  return res.json({ ok: true, name: "College Placement Management API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/drives", driveRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/placements", placementRoutes);

if (hasFrontendBuild) {
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4518;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`âœ… Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("âŒ DB connection failed:", err.message);
    process.exit(1);
  });
