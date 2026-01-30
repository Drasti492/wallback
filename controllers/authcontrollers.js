const User = require("../models/user");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/* ================= TOKEN ================= */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      phone,
      email,
      password,
      emailVerificationCode: crypto
        .createHash("sha256")
        .update(code)
        .digest("hex"),
      emailVerificationExpires: Date.now() + 10 * 60 * 1000,
    });

    // TODO: SEND EMAIL HERE
    console.log("Verification code:", code);

    res.status(201).json({
      message: "Account created. Verification code sent.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ================= VERIFY EMAIL ================= */
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const hashed = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email,
      emailVerificationCode: hashed,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch {
    res.status(500).json({ message: "Verification failed" });
  }
};

/* ================= RESEND CODE ================= */
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.isEmailVerified) {
      return res.json({ message: "No action required" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailVerificationCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // TODO: SEND EMAIL HERE
    console.log("Resent verification code:", code);

    res.json({ message: "Verification code resent" });
  } catch {
    res.status(500).json({ message: "Failed to resend code" });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "If email exists, code sent." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetCode = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    user.resetCodeExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // TODO: SEND EMAIL HERE
    console.log("Reset code:", code);

    res.json({ message: "Reset code sent" });
  } catch {
    res.status(500).json({ message: "Failed to send reset code" });
  }
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const hashed = crypto
      .createHash("sha256")
      .update(code)
      .digest("hex");

    const user = await User.findOne({
      email,
      resetCode: hashed,
      resetCodeExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    user.password = newPassword;
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ message: "Reset failed" });
  }
};
