const Post             = require("../models/Post");
const ModerationResult = require("../models/ModerationResult");
const ModerationJob    = require("../models/ModerationJob");


const getStats = async (req, res) => {
  try {
    const [counts, avgResult] = await Promise.all([
      Post.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ModerationResult.aggregate([
        { $group: { _id: null, avg_ms: { $avg: "$processing_ms" } } },
      ]),
    ]);

    const stats = { pending: 0, approved: 0, flagged: 0, rejected: 0, total: 0 };
    counts.forEach((c) => { if (c._id in stats) stats[c._id] = c.count; });
    stats.total = stats.pending + stats.approved + stats.flagged + stats.rejected;
    stats.avg_processing_ms = avgResult[0]?.avg_ms
      ? Math.round(avgResult[0].avg_ms)
      : null;

    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFlaggedPosts = async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip   = (page - 1) * limit;
    const reason = req.query.reason; // optional filter e.g. ?reason=toxic_text

    const filter = { status: { $in: ["flagged", "pending"] } };
    if (reason) filter.flag_reasons = reason;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id",      "username email")
        .populate("moderated_by", "username"),
      Post.countDocuments(filter),
    ]);

    res.json({ success: true, posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const approvePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.status       = "approved";
    post.moderated_by = req.user._id;
    post.moderated_at = new Date();
    await post.save();

    res.json({ success: true, post_id: post._id, status: "approved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
 
const rejectPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.status       = "rejected";
    post.moderated_by = req.user._id;
    post.moderated_at = new Date();

    if (req.body.reason) {
      post.flag_reasons = [...new Set([...post.flag_reasons, req.body.reason])];
    }
    await post.save();

    res.json({ success: true, post_id: post._id, status: "rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMlResult = async (req, res) => {
  try {
    const result = await ModerationResult.findOne({ post_id: req.params.post_id });
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "ML result not available yet — post may still be processing",
      });
    }
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const mlCallback = async (req, res) => {
  try {
    const {
      job_id,
      post_id,
      final_verdict,
      flag_reasons,
      text_result,
      image_result,
      misinfo_result,
      processing_ms,
    } = req.body;

    // Validate required fields
    if (!job_id || !post_id || !final_verdict) {
      return res.status(400).json({
        success: false,
        message: "job_id, post_id and final_verdict are all required",
      });
    }

    const validVerdicts = ["approved", "flagged", "rejected"];
    if (!validVerdicts.includes(final_verdict)) {
      return res.status(400).json({
        success: false,
        message: `final_verdict must be one of: ${validVerdicts.join(", ")}`,
      });
    }

   
    await ModerationResult.findOneAndUpdate(
      { post_id },
      {
        job_id,
        post_id,
        final_verdict,
        flag_reasons:   flag_reasons   || [],
        text_result:    text_result    || null,
        image_result:   image_result   || null,
        misinfo_result: misinfo_result || null,
        processing_ms:  processing_ms  || null,
        processed_at:   new Date(),
      },
      { upsert: true, new: true }
    );

    // 2. Update post status + flag_reasons in posts collection
    await Post.findByIdAndUpdate(post_id, {
      status:       final_verdict,
      flag_reasons: flag_reasons || [],
    });

    // 3. Mark job as done in moderation_jobs
    await ModerationJob.findOneAndUpdate(
      { job_id },
      { queue_status: "done", completed_at: new Date() }
    );

    console.log(`[ML Callback] post ${post_id} → ${final_verdict} | ${processing_ms}ms`);
    res.json({ success: true, message: "ML result saved successfully" });
  } catch (err) {
    console.error("[ML Callback] Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStats, getFlaggedPosts, approvePost, rejectPost, getMlResult, mlCallback };
