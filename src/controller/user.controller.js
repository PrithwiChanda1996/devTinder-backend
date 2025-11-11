const userService = require("../services/user.service");

// Signup controller
const signup = async (req, res, next) => {
  try {
    // Call service layer to handle business logic
    const result = await userService.registerUser(req.body);

    // Send success response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup };
