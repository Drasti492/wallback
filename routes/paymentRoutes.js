const express = require("express");
const router = express.Router();
const auth = require("../middleware/authmiddleware");

const {
  stkPush,
  payheroCallback,
  paymentStatus
} = require("../controllers/paymentController");

router.post("/stk-push", auth, stkPush);
router.post("/payhero-callback", payheroCallback);
router.get("/status/:reference", auth, paymentStatus);

module.exports = router;
