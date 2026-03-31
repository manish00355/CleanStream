const express   = require("express");
const cors    = require("cors");
const morgan   = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();

// Core middleware 
app.use(cors({
  origin:      process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,         
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Mount routes 
app.use("/api/auth",       require("./routes/auth.routes"));
app.use("/api/posts",      require("./routes/post.routes"));
app.use("/api/moderation", require("./routes/moderation.routes"));

// Health check
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// global error handler
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);

  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ success: false, message: "File too large — max 5 MB" });

  if (err.message?.toLowerCase().includes("only image"))
    return res.status(400).json({ success: false, message: err.message });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
