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

const reviewSchema = new Schema({
  user_id: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now,
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
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
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
    currency: {
      type: String,
      required: true,
      enum: ["USD", "INR"],
    },
    description: {
      type: String,
    },
    features: {
      type: [String],
    },
    specifications: specificationSchema,
    images: [imageSchema],
    reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
    stock: stockSchema,
    seller: sellerSchema,
  },
  {
    timestamps: true,
  }
);

const ProductModel = model("Product", productSchema);
module.exports = ProductModel;
