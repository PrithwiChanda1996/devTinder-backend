const Joi = require("joi");

// Joi schema for user signup validation
const signupSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().required().messages({
    "string.empty": "First name is required",
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name cannot exceed 50 characters",
  }),

  lastName: Joi.string().min(2).max(50).trim().required().messages({
    "string.empty": "Last name is required",
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name cannot exceed 50 characters",
  }),

  username: Joi.string().min(3).max(30).trim().lowercase().required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
  }),

  email: Joi.string().email().trim().lowercase().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),

  mobileNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Please provide a valid 10-digit mobile number",
    }),

  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters long",
  }),

  age: Joi.number().optional().messages({
    "number.base": "Age must be a number",
  }),

  gender: Joi.string()
    .valid("male", "female", "other")
    .lowercase()
    .optional()
    .messages({
      "any.only": "Gender must be either male, female, or other",
    }),
});

// Validation middleware function
const validateSignup = (req, res, next) => {
  const { error, value } = signupSchema.validate(req.body, {
    abortEarly: false, // Return all errors, not just the first one
    stripUnknown: true, // Remove unknown fields
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errorMessages,
    });
  }

  // Replace req.body with validated and sanitized data
  req.body = value;
  next();
};

module.exports = { validateSignup };
