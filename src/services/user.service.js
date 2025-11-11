const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { jwtConfig } = require("../config/config");

/**
 * Check if a user exists by email or username
 * @param {string} email - User email
 * @param {string} username - Username
 * @returns {Promise<Object|null>} - Existing user or null
 */
const findExistingUser = async (email, username) => {
  return await User.findOne({
    $or: [{ email }, { username }],
  });
};

/**
 * Create a new user in the database
 * @param {Object} userData - User data object
 * @returns {Promise<Object>} - Created user document
 */
const createUser = async (userData) => {
  const { firstName, lastName, username, email, mobileNumber, password, age, gender } = userData;

  const newUser = new User({
    firstName,
    lastName,
    username,
    email,
    mobileNumber,
    password,
    age,
    gender,
  });

  await newUser.save();
  return newUser;
};

/**
 * Generate JWT token for a user
 * @param {Object} user - User document
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - Object containing user info and token
 * @throws {Error} - If user already exists or validation fails
 */
const registerUser = async (userData) => {
  const { email, username } = userData;

  // Check if user already exists
  const existingUser = await findExistingUser(email, username);

  if (existingUser) {
    if (existingUser.email === email) {
      const error = new Error("User with this email already exists");
      error.statusCode = 409;
      error.field = "email";
      throw error;
    }
    if (existingUser.username === username) {
      const error = new Error("Username is already taken");
      error.statusCode = 409;
      error.field = "username";
      throw error;
    }
  }

  // Create new user (password will be hashed by pre-save middleware)
  const newUser = await createUser(userData);

  // Generate JWT token
  const token = generateToken(newUser);

  // Return only required fields
  return {
    id: newUser._id,
    username: newUser.username,
    token,
  };
};

module.exports = {
  registerUser,
  findExistingUser,
  createUser,
  generateToken,
};

