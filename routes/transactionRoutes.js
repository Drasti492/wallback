const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authmiddleware");
const {
  getMyTransactions
} = require("../controllers/transactionController");

router.get("/", authMiddleware, getMyTransactions);

module.exports = router;