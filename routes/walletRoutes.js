const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");

const {
  myWallet,
  withdrawFunds
} = require("../controllers/walletController");

/**
 * Wallet routes
 */
router.get("/me", authMiddleware, myWallet);
router.post("/withdraw", authMiddleware, withdrawFunds);

module.exports = router;
