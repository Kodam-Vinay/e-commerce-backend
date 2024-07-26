const express = require("express");
const {
  registerShopOrAdmin,
  sendShopOrAdminOtp,
  verifyShopOrAdminOtp,
  loginShopAdmin,
  updateShopAdmin,
} = require("../controllers/shopAdminController");
const { authorizeUser } = require("../utils/constants");

const router = express.Router();

router.post("/register", registerShopOrAdmin);
router.post("/verify-otp", verifyShopOrAdminOtp);
router.post("/send-otp", sendShopOrAdminOtp);
router.post("/login", loginShopAdmin);
router.put("/update", authorizeUser, updateShopAdmin);
module.exports = router;
