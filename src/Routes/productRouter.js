const express = require("express");

const {
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
} = require("../utils/constants");
const {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProduct,
} = require("../controllers/productController");
const router = express.Router();

router.get("/all", authorizeUser, verificationMiddleWare, getAllProducts);
router.post(
  "/add",
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
  addProduct
);
router.put(
  "/update",
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
  updateProduct
);
router.delete(
  "/delete",
  authorizeUser,
  verificationMiddleWare,
  authorizeSeller,
  deleteProduct
);
router.get("/:product_id", authorizeUser, getProduct);

module.exports = router;
