const express = require("express");
const {
  registerUser,
  verifyOtp,
  loginUser,
  sendOtp,
  updateUser,
  loginAsGuest,
  deleteUser,
} = require("../src/controllers/userController");
const { authorizeUser } = require("../src/utils/constants");
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/send-otp", sendOtp);
router.post("/login", loginUser);
router.post("/guest-login", loginAsGuest);
router.put("/update-user", authorizeUser, updateUser);
router.delete("/delete", authorizeUser, deleteUser);

module.exports = {
  userRouter: router,
};
