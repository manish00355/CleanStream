const jwt  = require("jsonwebtoken");
const User = require("../models/User");


// Checks Authorization: Bearer <accessToken>
// Attaches req.user on success
const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token   = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // JWT payload: { user_id, role, iat, exp }
    const user = await User.findById(decoded.user_id).select("-password_hash");

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "User not found or inactive" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Access token expired — call /api/auth/refresh" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

module.exports = verifyToken;
