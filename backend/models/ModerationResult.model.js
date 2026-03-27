const mongoose = require("mongoose");

//  moderation_results collection
const moderationResultSchema = new mongoose.Schema(
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
      unique:   true,
    },

    final_verdict: {
      type:     String,
      enum:     ["approved", "flagged", "rejected"],
      required: true,
    },

    flag_reasons:   {
         type: [String],                      default: [] 
        },// e.g. ['toxic_text', 'nsfw_image', 'misinformation']

    text_result: {
         type: mongoose.Schema.Types.Mixed,   default: null 
        }, // e.g. { toxicity_score: 0.85, categories: ['hate_speech'] }
    image_result:   { 
        type: mongoose.Schema.Types.Mixed,   default: null 
    },
    misinfo_result: {
         type: mongoose.Schema.Types.Mixed,   default: null 
        },
    processing_ms:  {
         type: Number,                        default: null 
        },
    processed_at:   {
         type: Date,                          default: Date.now
         },
  },
  { timestamps: false }
);

moderationResultSchema.index({ post_id: 1 });
moderationResultSchema.index({ job_id:  1 });

module.exports = mongoose.model("ModerationResult", moderationResultSchema);
