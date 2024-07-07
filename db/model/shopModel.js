const { Schema, model } = require("mongoose");

const shopSchema = new Schema(
  {
    shop_id: {
      type: String,
      required: true,
      minLength: 4,
      default: "random",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },
    image: {
      type: String,
      required: true,
      default: "DUMMY_PROFILE_LOGO.png",
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
    address: {
      type: String,
      required: true,
    },
    reg_type: {
      type: String,
      required: true,
      enum: ["seller"],
    },
  },
  { timestamps: true }
);

const ShopModel = model("Shop", shopSchema);
module.exports = {
  ShopModel,
};
