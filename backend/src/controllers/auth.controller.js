const jwt  = require("jsonwebtoken");
const User = require("../models/User");



const signAccess = (user) =>
  jwt.sign(
    { user_id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" }
  );

const signRefresh = (user) =>
  jwt.sign(
    { user_id: user._id.toString(), role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" }
  );


const REFRESH_COOKIE = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email or username already taken" });
    }

    const user = new User({
      username,
      email,
      password_hash: password,                         
      role: role === "moderator" ? "moderator" : "user",
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: "Account created",
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // select: false on password_hash — must explicitly select it
    const user = await User.findOne({ email }).select("+password_hash");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);

    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE);

    res.json({
      success: true,
      accessToken,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.user_id);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

  
    const newAccess  = signAccess(user);
    const newRefresh = signRefresh(user);

    res.cookie("refreshToken", newRefresh, REFRESH_COOKIE);
    res.json({ success: true, accessToken: newAccess });
  } catch (err) {
    res.clearCookie("refreshToken");
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
};


const logout = (_req, res) => {
  res.clearCookie("refreshToken", REFRESH_COOKIE);
  res.json({ success: true, message: "Logged out" });
};


const getMe = (req, res) => {
  const { _id, username, email, role } = req.user;
  res.json({ success: true, user: { id: _id, username, email, role } });
};

module.exports = { register, login, refresh, logout, getMe };
