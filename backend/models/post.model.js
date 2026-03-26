const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: null,
      maxlength: 2000,
      trim: true,
    },
    image_url: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "flagged", "rejected"],
      default: "pending",
    },
    flag_reasons: {
      type: [String], // e.g. ['toxic_text', 'nsfw_image', 'misinformation']
      default: [],
    },
    moderated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderated_at: {
      type: Date,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Indexes per ADR 2.2
postSchema.index({ user_id: 1 });
postSchema.index({ status: 1 });
postSchema.index({ created_at: -1 });

module.exports = mongoose.model("Post", postSchema);
