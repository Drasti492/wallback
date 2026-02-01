const User = require("../models/user");
const Transaction = require("../models/Transaction");
const Payment = require("../models/Payment");
const axios = require("axios");

/**
 * GET /api/wallet/me
 */
exports.myWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "walletAddress walletBalance email name isEmailVerified"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      walletAddress: user.walletAddress,
      walletBalance: user.walletBalance,
      isEmailVerified: user.isEmailVerified
    });
  } catch {
    res.status(500).json({ message: "Failed to load wallet" });
  }
};

/**
 * POST /api/wallet/withdraw
 * Initiates PayHero withdrawal (STK Push)
 */
exports.withdrawFunds = async (req, res) => {
  try {
    const { amount, phone } = req.body;
    const usdAmount = Number(amount);

    if (!phone || isNaN(usdAmount)) {
      return res.status(400).json({ message: "Invalid withdrawal data" });
    }

    if (usdAmount < 4850) {
      return res.status(400).json({ message: "Minimum withdrawal is $4,850" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.walletBalance < usdAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 💰 Withdrawal rules
    let kesAmount = 4430;
    if (usdAmount >= 7000) kesAmount = 6000;

    // Create payment record (DO NOT deduct yet)
    const payment = await Payment.create({
      user: user._id,
      phone,
      amount: usdAmount,
      type: "withdraw",
      status: "pending"
    });

    // Call PayHero
    const response = await axios.post(
      `${process.env.PAYHERO_BASE_URL}/api/v2/payments`,
      {
        amount: kesAmount,
        phone_number: phone,
        provider: "m-pesa",
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        external_reference: payment.reference,
        callback_url: process.env.PAYHERO_CALLBACK_URL,
        customer_name: user.name
      },
      {
        headers: {
          Authorization: `Basic ${process.env.PAYHERO_BASIC_AUTH}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      checkoutUrl: response.data.checkout_url
    });

  } catch (err) {
    console.error("WITHDRAW ERROR:", err.response?.data || err.message);
    res.status(500).json({ message: "Withdrawal initiation failed" });
  }
};