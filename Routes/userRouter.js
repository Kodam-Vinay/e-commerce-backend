const express = require("express");
const {
  registerUser,
  loginUser,
  updateUser,
  loginAsGuest,
  deleteUser,
  verifyUserOtp,
  sendUserOtp,
} = require("../src/controllers/userController");
const { authorizeUser } = require("../src/utils/constants");
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyUserOtp);
router.post("/send-otp", sendUserOtp);
router.post("/login", loginUser);
router.post("/guest-login", loginAsGuest);
router.put("/update-user", authorizeUser, updateUser);
router.delete("/delete", authorizeUser, deleteUser);

module.exports = {
  userRouter: router,
};
