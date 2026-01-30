const axios = require("axios");
const User = require("../models/user");
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");

/**
 * INITIATE DEPOSIT (STK PUSH)
 * POST /api/payments/stk-push
 */
exports.stkPush = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone and amount required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const payment = await Payment.create({
      user: user._id,
      phone,
      amount: Number(amount),
      type: "deposit"
    });

    const response = await axios.post(
      `${process.env.PAYHERO_BASE_URL}/api/v2/payments`,
      {
        amount: Number(amount),
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
      success: true,
      checkoutUrl: response.data.checkout_url
    });

  } catch (err) {
    console.error("STK PUSH ERROR:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to initiate deposit" });
  }
};

/**
 * PAYHERO CALLBACK (DEPOSIT + WITHDRAW)
 * POST /api/payments/payhero-callback
 */
exports.payheroCallback = async (req, res) => {
  try {
    const ref = req.body?.response?.ExternalReference;
    const resultCode = req.body?.response?.ResultCode;

    if (!ref) return res.sendStatus(400);

    const payment = await Payment.findOne({ reference: ref }).populate("user");
    if (!payment) return res.sendStatus(404);

    // 🔒 Prevent double processing
    if (payment.status !== "pending") {
      return res.sendStatus(200);
    }

    if (resultCode === 0) {
      payment.status = "success";
      await payment.save();

      const user = payment.user;

      if (payment.type === "deposit") {
        user.walletBalance += payment.amount;
      }

      if (payment.type === "withdraw") {
        user.walletBalance -= payment.amount;
      }

      await user.save();

      await Transaction.create({
        user: user._id,
        amount: payment.amount,
        type: payment.type,
        status: "completed"
      });

    } else {
      payment.status = "failed";
      await payment.save();
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("PAYHERO CALLBACK ERROR:", err);
    res.sendStatus(500);
  }
};

/**
 * POLL PAYMENT STATUS
 * GET /api/payments/status/:reference
 */
exports.paymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      reference: req.params.reference,
      user: req.user._id
    });

    if (!payment) {
      return res.json({ status: "not_found" });
    }

    res.json({ status: payment.status });
  } catch {
    res.json({ status: "error" });
  }
};