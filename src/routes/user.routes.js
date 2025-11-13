const express = require("express");
const router = express.Router();
const {
  signup,
  getUserById,
  getUserByEmail,
  getUserByMobileNumber,
  login,
} = require("../controller/user.controller");
const {
  validateSignup,
  validateGetUserById,
  validateGetUserByEmail,
  validateGetUserByMobile,
  validateLogin,
} = require("../middlewares/validation.middleware");

// POST /api/users/signup - User registration
router.post("/signup", validateSignup, signup);

// POST /api/users/login - User login
router.post("/login", validateLogin, login);

// GET /api/users/:id - Get user by ID
router.get("/:id", validateGetUserById, getUserById);

// GET /api/users/email/:email - Get user by email
router.get("/email/:email", validateGetUserByEmail, getUserByEmail);

// GET /api/users/mobile/:mobileNumber - Get user by mobile number
router.get(
  "/mobile/:mobileNumber",
  validateGetUserByMobile,
  getUserByMobileNumber
);

module.exports = router;
