const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCode: String,
    emailVerificationExpires: Date,

    resetCode: String,
    resetCodeExpire: Date,

    walletAddress: {
      type: String,
      unique: true,
    },

    walletBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* 🔐 Hash password */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

/* 🪙 Generate wallet address */
userSchema.pre("save", function (next) {
  if (!this.walletAddress) {
    this.walletAddress = "0x" + crypto.randomBytes(20).toString("hex");
  }
  next();
});

/* 🔑 Compare password */
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
