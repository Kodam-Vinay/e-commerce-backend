const { Schema, model } = require("mongoose");

const verificationSchema = new Schema(
  {
    user_shop: {
      type: Schema.ObjectId,
      ref: "modelType",
      required: true,
    },
    modelType: {
      type: String,
      required: true,
      enum: ["User", "Shop"],
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      expires: 300, //otp will automatically expires in 5 minutes
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

const VerificationEmailModel = model("Verification", verificationSchema);
module.exports = {
  VerificationEmailModel,
};
