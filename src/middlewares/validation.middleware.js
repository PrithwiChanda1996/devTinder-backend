const Joi = require("joi");
const { VALID_SKILLS } = require("../constants/skills.constants");

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

  age: Joi.number().min(18).max(100).optional().messages({
    "number.base": "Age must be a number",
    "number.min": "Age must be at least 18",
    "number.max": "Age cannot exceed 100",
  }),

  gender: Joi.string()
    .valid("male", "female", "other")
    .lowercase()
    .optional()
    .messages({
      "any.only": "Gender must be either male, female, or other",
    }),

  // Professional Profile Fields (Optional)
  skills: Joi.array()
    .items(Joi.string().valid(...VALID_SKILLS))
    .max(10)
    .optional()
    .messages({
      "array.max": "Maximum 10 skills allowed",
      "any.only": "Please provide valid skills from the predefined list",
    }),

  bio: Joi.string().trim().min(100).max(500).optional().messages({
    "string.min": "Bio must be at least 100 characters long",
    "string.max": "Bio cannot exceed 500 characters",
  }),

  currentPosition: Joi.string().trim().max(100).optional().messages({
    "string.max": "Current position cannot exceed 100 characters",
  }),

  currentOrganisation: Joi.string().trim().max(100).optional().messages({
    "string.max": "Current organisation cannot exceed 100 characters",
  }),

  location: Joi.string().trim().max(100).optional().messages({
    "string.max": "Location cannot exceed 100 characters",
  }),

  // Profile Media
  profilePhoto: Joi.string()
    .trim()
    .uri()
    .pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i)
    .optional()
    .messages({
      "string.uri": "Please provide a valid URL",
      "string.pattern.base":
        "Please provide a valid image URL (jpg, jpeg, png, gif, webp, svg)",
    }),

  // Social & Portfolio Links
  githubUrl: Joi.string()
    .trim()
    .uri()
    .pattern(/^https?:\/\/(www\.)?github\.com\/.+$/)
    .optional()
    .messages({
      "string.uri": "Please provide a valid URL",
      "string.pattern.base": "Please provide a valid GitHub URL",
    }),

  linkedinUrl: Joi.string()
    .trim()
    .uri()
    .pattern(/^https?:\/\/(www\.)?linkedin\.com\/.+$/)
    .optional()
    .messages({
      "string.uri": "Please provide a valid URL",
      "string.pattern.base": "Please provide a valid LinkedIn URL",
    }),

  portfolioUrl: Joi.string().trim().uri().optional().messages({
    "string.uri": "Please provide a valid portfolio URL",
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

// Validation schemas for GET user endpoints
const getUserByIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.empty": "User ID is required",
      "string.pattern.base": "Invalid user ID format",
    }),
});

const getUserByEmailSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
});

const getUserByMobileSchema = Joi.object({
  mobileNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required",
      "string.pattern.base": "Please provide a valid 10-digit mobile number",
    }),
});

// Validation middleware for getUserById
const validateGetUserById = (req, res, next) => {
  const { error, value } = getUserByIdSchema.validate(req.params, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errorMessages,
    });
  }

  req.params = value;
  next();
};

// Validation middleware for getUserByEmail
const validateGetUserByEmail = (req, res, next) => {
  const { error, value } = getUserByEmailSchema.validate(req.params, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errorMessages,
    });
  }

  req.params = value;
  next();
};

// Validation middleware for getUserByMobileNumber
const validateGetUserByMobile = (req, res, next) => {
  const { error, value } = getUserByMobileSchema.validate(req.params, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errorMessages,
    });
  }

  req.params = value;
  next();
};

// Joi schema for login validation
const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().messages({
    "string.email": "Please provide a valid email address",
  }),

  username: Joi.string().min(3).max(30).trim().lowercase().messages({
    "string.min": "Username must be at least 3 characters long",
    "string.max": "Username cannot exceed 30 characters",
  }),

  mobileNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Please provide a valid 10-digit mobile number",
    }),

  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
})
  .or("email", "username", "mobileNumber")
  .messages({
    "object.missing":
      "Please provide at least one of: email, username, or mobile number",
  });

// Validation middleware for login
const validateLogin = (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errorMessages,
    });
  }

  req.body = value;
  next();
};

// Joi schema for profile update validation
const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).trim().optional().messages({
    "string.min": "First name must be at least 2 characters long",
    "string.max": "First name cannot exceed 50 characters",
  }),

  lastName: Joi.string().min(2).max(50).trim().optional().messages({
    "string.min": "Last name must be at least 2 characters long",
    "string.max": "Last name cannot exceed 50 characters",
  }),

  age: Joi.number().min(18).max(100).optional().messages({
    "number.base": "Age must be a number",
    "number.min": "Age must be at least 18",
    "number.max": "Age cannot exceed 100",
  }),

  gender: Joi.string()
    .valid("male", "female", "other")
    .lowercase()
    .optional()
    .messages({
      "any.only": "Gender must be either male, female, or other",
    }),

  // Professional Profile Fields (Optional)
  skills: Joi.array()
    .items(Joi.string().valid(...VALID_SKILLS))
    .max(10)
    .optional()
    .messages({
      "array.max": "Maximum 10 skills allowed",
      "any.only": "Please provide valid skills from the predefined list",
    }),

  bio: Joi.string().trim().min(100).max(500).optional().messages({
    "string.min": "Bio must be at least 100 characters long",
    "string.max": "Bio cannot exceed 500 characters",
  }),

  currentPosition: Joi.string().trim().max(100).optional().messages({
    "string.max": "Current position cannot exceed 100 characters",
  }),

  currentOrganisation: Joi.string().trim().max(100).optional().messages({
    "string.max": "Current organisation cannot exceed 100 characters",
  }),

  location: Joi.string().trim().max(100).optional().messages({
    "string.max": "Location cannot exceed 100 characters",
  }),

  // Profile Media
  profilePhoto: Joi.string()
    .trim()
    .uri()
    .pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i)
    .optional()
    .messages({
      "string.uri": "Please provide a valid URL",
      "string.pattern.base":
        "Please provide a valid image URL (jpg, jpeg, png, gif, webp, svg)",
    }),

  // Social & Portfolio Links
  githubUrl: Joi.string()
    .trim()
    .uri()
    .pattern(/^https?:\/\/(www\.)?github\.com\/.+$/)
    .optional()
    .messages({
      "string.uri": "Please provide a valid URL",
      "string.pattern.base": "Please provide a valid GitHub URL",
    }),

  linkedinUrl: Joi.string()
    .trim()
    .uri()
    .pattern(/^https?:\/\/(www\.)?linkedin\.com\/.+$/)
    .optional()
    .messages({
      "string.uri": "Please provide a valid URL",
      "string.pattern.base": "Please provide a valid LinkedIn URL",
    }),

  portfolioUrl: Joi.string().trim().uri().optional().messages({
    "string.uri": "Please provide a valid portfolio URL",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });

// Validation middleware for profile update
const validateUpdateProfile = (req, res, next) => {
  const { error, value } = updateProfileSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errorMessages,
    });
  }

  req.body = value;
  next();
};

module.exports = {
  validateSignup,
  validateGetUserById,
  validateGetUserByEmail,
  validateGetUserByMobile,
  validateLogin,
  validateUpdateProfile,
};
