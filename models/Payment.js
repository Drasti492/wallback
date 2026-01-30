const mongoose = require("mongoose");
const crypto = require("crypto");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    phone: String,

    amount: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: ["deposit", "withdraw"],
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },

    reference: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(10).toString("hex")
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
