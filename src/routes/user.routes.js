const express = require("express");
const router = express.Router();
const { signup } = require("../controller/user.controller");
const { validateSignup } = require("../middlewares/validation.middleware");

// POST /api/users/signup - User registration
router.post("/signup", validateSignup, signup);

module.exports = router;
