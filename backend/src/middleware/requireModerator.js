
// Must be used AFTER verifyToken middleware.
// Checks req.user.role === 'moderator', else 403.
const requireModerator = (req, res, next) => {
  if (!req.user || req.user.role !== "moderator") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Moderator role required.",
    });
  }
  next();
};

module.exports = requireModerator;
