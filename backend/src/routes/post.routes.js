const express = require("express");
const router  = express.Router();
const {
  createPost,
  getFeed,
  getMyPosts,
  getPost,
  deletePost,
} = require("../controllers/post.controller");
const verifyToken  = require("../middleware/verifyToken");
const { upload }   = require("../config/cloudinary");




router.get("/feed", getFeed);


router.use(verifyToken);


router.post("/", upload.single("image"), createPost);

// GET /api/posts/my — current user's own posts, all statuses
router.get("/my", getMyPosts);

// GET /api/posts/:id
router.get("/:id", getPost);

// DELETE /api/posts/:id — owner only, also deletes Cloudinary image
router.delete("/:id", deletePost);

module.exports = router;
