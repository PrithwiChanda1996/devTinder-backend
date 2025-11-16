/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and protects routes
 */
const jwt = require("jsonwebtoken");
const { jwtConfig } = require("../config/config");

/**
 * Middleware to authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error(
        "Authentication required. Please provide a valid token"
      );
      error.statusCode = 401;
      return next(error);
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Attach decoded user information to request object
    req.user = decoded;

    // Proceed to next middleware
    next();
  } catch (error) {
    // JWT verification errors will be caught here
    // These are handled by the error middleware (JsonWebTokenError, TokenExpiredError)
    next(error);
  }
};

module.exports = { authenticate };
