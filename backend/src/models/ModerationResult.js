const mongoose = require("mongoose");

// moderation_results collection

const moderationResultSchema = new mongoose.Schema(
  {
    // UUID matching the BullMQ job id
    job_id: {
      type:     String,
      required: true,
      unique:   true,
    },

    // One result per post
    post_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Post",
      required: true,
      unique:   true,
    },

    final_verdict: {
      type:     String,
      enum:     ["approved", "flagged", "rejected"],
      required: true,
    },

        // Reasons for flagging — e.g. ["toxic_text", "nsfw_image", "misinformation"]
    flag_reasons: { type: [String], default: [] },

    // Full Perspective API scores
    text_result:    { type: mongoose.Schema.Types.Mixed, default: null },

    // Full NudeNet + Gemini Vision scores
    image_result:   { type: mongoose.Schema.Types.Mixed, default: null },

    // Misinformation check result
    misinfo_result: { type: mongoose.Schema.Types.Mixed, default: null },

    
    processing_ms: { type: Number, default: null },

    processed_at:  { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// moderationResultSchema.index({ post_id: 1 });
// moderationResultSchema.index({ job_id:  1 });

module.exports = mongoose.model("ModerationResult", moderationResultSchema);
