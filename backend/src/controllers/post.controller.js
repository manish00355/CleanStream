const { v4: uuidv4 }     = require("uuid");
const Post               = require("../models/Post");
const ModerationJob      = require("../models/ModerationJob");
const { moderationQueue} = require("../config/redis");
const { deleteImage }    = require("../config/cloudinary");


const createPost = async (req, res) => {
  try {
    const { text } = req.body;

 
    const image_url            = req.file ? req.file.path     : null;
    const cloudinary_public_id = req.file ? req.file.filename : null;

    if (!text?.trim() && !image_url) {
      return res.status(400).json({
        success: false,
        message: "Post must contain text, an image, or both",
      });
    }

    
    const post = await Post.create({
      user_id: req.user._id,
      text:    text?.trim() || null,
      image_url,
      cloudinary_public_id,
      status:  "pending",
    });

    
    const job_id = uuidv4();
    await ModerationJob.create({
      job_id,
      post_id:      post._id,
      queue_status: "queued",
      enqueued_at:  new Date(),
    });

   
    await moderationQueue.add("moderate", {
      job_id,
      post_id:   post._id.toString(),
      text:      post.text   || null,
      image_url: image_url   || null,
    });

    
    return res.status(202).json({
      success:  true,
      post_id:  post._id,
      status:   "pending",
      message:  "Post submitted for review",
      post: {
        id:        post._id,
        text:      post.text,
        image_url: post.image_url,
        status:    post.status,
        createdAt: post.created_at,
      },
    });
  } catch (err) {
    // If Cloudinary upload succeeded but DB save failed — clean up orphan image
    if (req.file?.filename) await deleteImage(req.file.filename);
    res.status(500).json({ success: false, message: err.message });
  }
};


const getFeed = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ status: "approved" })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "username"),
      Post.countDocuments({ status: "approved" }),
    ]);

    res.json({ success: true, posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find({ user_id: req.user._id })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments({ user_id: req.user._id }),
    ]);

    res.json({ success: true, posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("user_id", "username");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own posts" });
    }

    // Delete from Cloudinary first
    await deleteImage(post.cloudinary_public_id);

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createPost, getFeed, getMyPosts, getPost, deletePost };
