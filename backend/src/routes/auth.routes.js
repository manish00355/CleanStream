const express   = require("express");
const router    = express.Router();
const { body }  = require("express-validator");
const {
  register, login, refresh, logout, getMe,
} = require("../controllers/auth.controller");
const verifyToken = require("../middleware/verifyToken");
const validate    = require("./validate");

// POST /api/auth/register
router.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3–30 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);


router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

// GET /api/auth/me
router.get("/me", verifyToken, getMe);

module.exports = router;
