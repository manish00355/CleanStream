const mongoose = require("mongoose");

//  posts collection
const postSchema = new mongoose.Schema(
  {
    user_id: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },

    // Post content — text and/or image (at least one required, enforced in controller)
    text: {
      type:      String,
      default:   null,
      maxlength: 2000,
      trim:      true,
    },

    // Full Cloudinary CDN URL stored here
   
    image_url: {
      type:    String,
      default: null,
    },

    // Cloudinary public_id needed to DELETE the image when post is removed
  
    cloudinary_public_id: {
      type:    String,
      default: null,
    },

    //  — moderation status
    status: {
      type:    String,
      enum:    ["pending", "approved", "flagged", "rejected"],
      default: "pending",
    },

    //  ["toxic_text", "nsfw_image", "misinformation"]
    flag_reasons: {
      type:    [String],
      default: [],
    },

    // Set when a human moderator takes action
    moderated_by: {
         type: mongoose.Schema.Types.ObjectId, ref: "User", default: null
         },
    moderated_at: {
         type:Date,                                   default: null },

    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Indexes for efficient querying
postSchema.index({ user_id:    1 });           // GET /posts/my
postSchema.index({ status:     1 });           // moderator dashboard
postSchema.index({ created_at: -1 });          // feed pagination

module.exports = mongoose.model("Post", postSchema);
