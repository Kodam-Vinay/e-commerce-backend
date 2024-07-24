const express = require("express");
const {
  getAllUsers,
  deleteUserAdmin,
  addNewUser,
} = require("../controllers/adminControllers");
const {
  authorizeUser,
  authorizeAdmin,
  verificationMiddleWare,
} = require("../utils/constants");

const router = express.Router();
router.get(
  "/all-users",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  getAllUsers
);
router.post(
  "/add-user",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  addNewUser
);
router.delete(
  "/delete-user",
  authorizeUser,
  verificationMiddleWare,
  authorizeAdmin,
  deleteUserAdmin
);
module.exports = router;
