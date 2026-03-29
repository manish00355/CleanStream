const express = require("express");
const router  = express.Router();
const {
  getStats,
  getFlaggedPosts,
  approvePost,
  rejectPost,
  getMlResult,
  mlCallback,
} = require("../controllers/moderation.controller");
const verifyToken      = require("../middleware/verifyToken");
const requireModerator = require("../middleware/requireModerator");


router.post("/ml-callback", mlCallback);

// ── All routes below require login + moderator role ───────────────────────────
router.use(verifyToken, requireModerator);

// GET  /api/moderation/stats
router.get("/stats", getStats);

// GET  /api/moderation/flagged   ?page=1&limit=20&reason=toxic_text
router.get("/flagged", getFlaggedPosts);

// GET  /api/moderation/:post_id/result   — full ML scores + confidence breakdown
router.get("/:post_id/result", getMlResult);

// POST /api/moderation/:post_id/approve
router.post("/:post_id/approve", approvePost);

// POST /api/moderation/:post_id/reject   body: { reason?: "custom note" }
router.post("/:post_id/reject", rejectPost);

module.exports = router;
