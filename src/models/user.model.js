const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { VALID_SKILLS } = require("../constants/skills.constants");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      minlength: [2, "First name must be at least 2 characters long"],
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Last name must be at least 2 characters long"],
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit mobile number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    age: {
      type: Number,
      min: [18, "Age must be at least 18"],
      max: [100, "Age cannot exceed 100"],
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "other"],
        message: "Gender must be either male, female, or other",
      },
      lowercase: true,
    },
    // Professional Profile Fields (Optional)
    skills: {
      type: [String],
      validate: {
        validator: function (skills) {
          // Check if array has max 10 items
          if (skills.length > 10) {
            return false;
          }
          // Check if all skills are valid
          return skills.every((skill) => VALID_SKILLS.includes(skill));
        },
        message:
          "Skills must be from the predefined list and maximum 10 skills allowed",
      },
    },
    bio: {
      type: String,
      trim: true,
      minlength: [100, "Bio must be at least 100 characters long"],
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    currentPosition: {
      type: String,
      trim: true,
      maxlength: [100, "Current position cannot exceed 100 characters"],
    },
    currentOrganisation: {
      type: String,
      trim: true,
      maxlength: [100, "Current organisation cannot exceed 100 characters"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    // Profile Media
    profilePhoto: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i,
        "Please provide a valid image URL",
      ],
    },
    // Social & Portfolio Links (Optional)
    githubUrl: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/(www\.)?github\.com\/.+$/,
        "Please provide a valid GitHub URL",
      ],
    },
    linkedinUrl: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/(www\.)?linkedin\.com\/.+$/,
        "Please provide a valid LinkedIn URL",
      ],
    },
    portfolioUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+\..+$/, "Please provide a valid portfolio URL"],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Pre-save middleware to hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt and hash the password
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

// Create and export the User model
const User = mongoose.model("User", userSchema);

module.exports = User;
