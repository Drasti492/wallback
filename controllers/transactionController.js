const Transaction = require("../models/Transaction");

/**
 * GET /api/transactions
 * Get all transactions for logged-in user
 */
exports.getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to load transactions" });
  }
};