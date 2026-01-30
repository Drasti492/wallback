const express = require("express");
const router = express.Router();

const {
  register,
  login,
  verifyCode,
  resendVerification,
  forgotPassword,
  resetPassword,
} = require("../controllers/authcontrollers");

/* AUTH */
router.post("/register", register);
router.post("/login", login);

/* EMAIL VERIFICATION */
router.post("/verify-code", verifyCode);
router.post("/resend-verification", resendVerification);

/* PASSWORD RESET */
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;