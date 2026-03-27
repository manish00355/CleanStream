const cloudinary            = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer                = require("multer");

// Cloudinary configuration using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Storage engine — images go to "cleanstream" folder in your account ───────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          "cleanstream",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    resource_type:   "image",
    // Unique public_id so filenames never clash
    public_id: (_req, file) => {
      const ts     = Date.now();
      const rand   = Math.round(Math.random() * 1e9);
      const name   = file.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-");
      return `post-${name}-${ts}-${rand}`;
    },
  },
});

// ── File type guard ─
const fileFilter = (_req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk   = allowed.test(file.originalname.toLowerCase().split(".").pop());
  const mimeOk  = allowed.test(file.mimetype);
  extOk && mimeOk
    ? cb(null, true)
    : cb(new Error("Only image files allowed: jpg, png, gif, webp"));
};

// ── Multer instance (used in post.routes.js) ─
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard limit
});

// Helper to delete image from Cloudinary by public_id (called when post is deleted or image is replaced)
const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Deleted ${publicId} →`, result.result);
  } catch (err) {
    console.error("[Cloudinary] Delete failed:", err.message);
  }
};

console.log("[Cloudinary] Configured for cloud:", process.env.CLOUDINARY_CLOUD_NAME);

module.exports = { cloudinary, upload, deleteImage };
