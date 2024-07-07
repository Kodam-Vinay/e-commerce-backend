const express = require("express");
const {
  registerShop,
  verifyShopOtp,
  sendShopOtp,
} = require("../src/controllers/shopController");
const router = express.Router();

router.post("/register", registerShop);
router.post("/verify-otp", verifyShopOtp);
router.post("/send-otp", sendShopOtp);
module.exports = {
  shopRouter: router,
};
