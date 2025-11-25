import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { VALID_SKILLS } from '../../common/constants/skills.constant';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  firstName: string;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 50 })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30,
  })
  username: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
  })
  email: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    match: /^[0-9]{10}$/,
  })
  mobileNumber: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ min: 18, max: 100 })
  age?: number;

  @Prop({ enum: ['male', 'female', 'other'], lowercase: true })
  gender?: string;

  @Prop({
    type: [String],
    validate: {
      validator: function (skills: string[]) {
        return skills.length <= 10 && skills.every((skill) => VALID_SKILLS.includes(skill));
      },
      message: 'Skills must be from predefined list and max 10 allowed',
    },
  })
  skills?: string[];

  @Prop({ trim: true, minlength: 100, maxlength: 500 })
  bio?: string;

  @Prop({ trim: true, maxlength: 100 })
  currentPosition?: string;

  @Prop({ trim: true, maxlength: 100 })
  currentOrganisation?: string;

  @Prop({ trim: true, maxlength: 100 })
  location?: string;

  @Prop({
    trim: true,
    match: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i,
  })
  profilePhoto?: string;

  @Prop({
    trim: true,
    match: /^https?:\/\/(www\.)?github\.com\/.+$/,
  })
  githubUrl?: string;

  @Prop({
    trim: true,
    match: /^https?:\/\/(www\.)?linkedin\.com\/.+$/,
  })
  linkedinUrl?: string;

  @Prop({
    trim: true,
    match: /^https?:\/\/.+\..+$/,
  })
  portfolioUrl?: string;

  // Method to compare passwords
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Add comparePassword method to schema
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
