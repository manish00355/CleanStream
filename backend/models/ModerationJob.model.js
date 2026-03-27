const mongoose = require("mongoose");

//   moderation_jobs collection
const moderationJobSchema = new mongoose.Schema(
  {
    job_id: {
      type:     String,
      required: true,
      unique:   true,
    },

    post_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "Post",
      required: true,
    },

    queue_status: {
      type:    String,
      enum:    ["queued", "processing", "done", "failed"],
      default: "queued",
    },

    enqueued_at:  { type: Date,   default: Date.now },
    completed_at: { type: Date,   default: null },
    retry_count:  { type: Number, default: 0 },
    error:        { type: String, default: null },
  },
  { timestamps: false }
);

moderationJobSchema.index({ post_id:      1 });
moderationJobSchema.index({ queue_status: 1 });

module.exports = mongoose.model("ModerationJob", moderationJobSchema);
