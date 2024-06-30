const express = require("express");
const { authorizeUser } = require("../src/utils/constants");
const {
  getAllProducts,
  addProduct,
  deleteProduct,
  updateProduct,
  getProduct,
} = require("../src/controllers/productController");
const router = express.Router();

router.get("/all", authorizeUser, getAllProducts);
router.post("/add", authorizeUser, addProduct);
router.put("/update", authorizeUser, updateProduct);
router.delete("/delete", authorizeUser, deleteProduct);
router.get("/:product_id", authorizeUser, getProduct);

module.exports = {
  productRouter: router,
};
