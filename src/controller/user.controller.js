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

// Get user by ID controller
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by email controller
const getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    const user = await userService.getUserByEmail(email);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by mobile number controller
const getUserByMobileNumber = async (req, res, next) => {
  try {
    const { mobileNumber } = req.params;
    const user = await userService.getUserByMobileNumber(mobileNumber);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Login controller
const login = async (req, res, next) => {
  try {
    // Call service layer to handle authentication
    const result = await userService.loginUser(req.body);

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  getUserById,
  getUserByEmail,
  getUserByMobileNumber,
  login,
};
