import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "jeng", "admin"], // Example roles
      default: "user",
    },
  },
  { timestamps: true }
);

// Pre-save hook for password hashing
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method for registration
UserSchema.statics.register = async function (userData) {
  try {
    const user = new this(userData);
    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
};

// Static method to find by username
UserSchema.statics.findByUsername = async function (username) {
  return await this.findOne({ username });
};

// Static method to get engineers
UserSchema.statics.getEngineers = async function () {
  return await this.find({ role: "jeng" });
};

const User = mongoose.model("User", UserSchema);

export default User;
