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
  const {
    firstName,
    lastName,
    username,
    email,
    mobileNumber,
    password,
    age,
    gender,
  } = userData;

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

/**
 * Get user by ID
 * @param {string} userId - User MongoDB ObjectId
 * @returns {Promise<Object>} - User object without password
 * @throws {Error} - If user not found
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} - User object without password
 * @throws {Error} - If user not found
 */
const getUserByEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "-password"
  );

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Get user by mobile number
 * @param {string} mobileNumber - User mobile number
 * @returns {Promise<Object>} - User object without password
 * @throws {Error} - If user not found
 */
const getUserByMobileNumber = async (mobileNumber) => {
  const user = await User.findOne({ mobileNumber }).select("-password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Login user with email, username, or mobile number
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.password - User password
 * @param {string} [credentials.email] - User email
 * @param {string} [credentials.username] - Username
 * @param {string} [credentials.mobileNumber] - Mobile number
 * @returns {Promise<Object>} - Object containing user info and token
 * @throws {Error} - If user not found or password is invalid
 */
const loginUser = async (credentials) => {
  const { email, username, mobileNumber, password } = credentials;

  // Find user by email, username, or mobile number
  let user;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase() });
  } else if (username) {
    user = await User.findOne({ username: username.toLowerCase() });
  } else if (mobileNumber) {
    user = await User.findOne({ mobileNumber });
  }

  // If user doesn't exist, ask them to sign up
  if (!user) {
    const error = new Error("User not found. Please sign up first");
    error.statusCode = 404;
    throw error;
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    const error = new Error("Invalid password");
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = generateToken(user);

  // Return user info and token
  return {
    id: user._id,
    username: user.username,
    token,
  };
};

module.exports = {
  registerUser,
  findExistingUser,
  createUser,
  generateToken,
  getUserById,
  getUserByEmail,
  getUserByMobileNumber,
  loginUser,
};
