const express = require("express");

const { authorizeUser } = require("../utils/constants");
const {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProduct,
} = require("../controllers/productController");
const router = express.Router();

router.get("/all", authorizeUser, getAllProducts);
router.post("/add", authorizeUser, addProduct);
router.put("/update", authorizeUser, updateProduct);
router.delete("/delete", authorizeUser, deleteProduct);
router.get("/:product_id", authorizeUser, getProduct);

module.exports = {
  productRouter: router,
};
