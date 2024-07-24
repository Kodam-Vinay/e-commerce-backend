const express = require("express");
const {
  registerShopOrAdmin,
  sendShopOrAdminOtp,
  verifyShopOrAdminOtp,
  loginShopAdmin,
} = require("../controllers/shopAdminController");

const router = express.Router();

router.post("/register", registerShopOrAdmin);
router.post("/verify-otp", verifyShopOrAdminOtp);
router.post("/send-otp", sendShopOrAdminOtp);
router.post("/login", loginShopAdmin);
module.exports = router;
