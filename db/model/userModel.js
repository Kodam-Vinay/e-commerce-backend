const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    user_id: {
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
    is_premium_user: {
      type: Boolean,
      required: true,
      default: false,
    },
    verified: {
      type: Boolean,
      required: true,
      default: false,
    },
    reg_type: {
      type: String,
      required: true,
      enum: ["buyer", "guest", "admin"],
    },
  },
  {
    timestamps: true,
  }
);
const UserModel = model("User", userSchema);
module.exports = {
  UserModel,
  userSchema,
};
