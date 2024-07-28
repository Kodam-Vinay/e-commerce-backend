const { Schema, model } = require("mongoose");

const specificationSchema = new Schema({
  weight: {
    type: Number,
  },
  dimensions: {
    type: String, // "10 x 5 x 2 inches"
  },
  color: {
    type: String,
  },
  battery_life: {
    type: Number,
  },
});

const imageSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  alt_text: {
    type: String,
  },
});

const stockSchema = new Schema({
  available: {
    type: Number,
    required: true,
  },
  warehouse_location: {
    type: String,
    required: true,
  },
});

const sellerSchema = new Schema({
  seller_id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
});

const productSchema = new Schema(
  {
    product_id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    features: {
      type: [String],
    },
    specifications: specificationSchema,
    images: [imageSchema],
    reviews: {
      type: Array,
      ref: "Review",
    },
    stock: stockSchema,
    seller: sellerSchema,
  },
  {
    timestamps: true,
  }
);

const ProductModel = model("Product", productSchema);
module.exports = ProductModel;
