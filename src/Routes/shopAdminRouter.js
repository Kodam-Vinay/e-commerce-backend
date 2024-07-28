const express = require("express");
const {
  registerShopOrAdmin,
  sendShopOrAdminOtp,
  verifyShopOrAdminOtp,
  loginShopAdmin,
  updateShopAdmin,
  forgetPasswordShopAdmin,
  updatePasswordShopAdmin,
  verifyOtpForgetPasswordShopAdmin,
} = require("../controllers/shopAdminController");
const { authorizeUser } = require("../utils/constants");

const router = express.Router();

router.post("/register", registerShopOrAdmin);
router.post("/verify-otp", verifyShopOrAdminOtp);
router.post("/send-otp", sendShopOrAdminOtp);
router.post("/login", loginShopAdmin);
router.post("/forget-password", forgetPasswordShopAdmin);
router.post("/verify-forget-password-otp", verifyOtpForgetPasswordShopAdmin);
router.post("/update-password", updatePasswordShopAdmin);
router.put("/update", authorizeUser, updateShopAdmin);
module.exports = router;
