const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
      default: "DUMMY_PRODUCT_LOGO.png",
    },
    category: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    specifications: {
      type: Array,
      required: true,
    },
    seller_id: {
      type: String,
      required: true,
    },
    is_premium_product: {
      type: Boolean,
      required: true,
      default: false,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ProductModel = model("Product", productSchema);
module.exports = ProductModel;
