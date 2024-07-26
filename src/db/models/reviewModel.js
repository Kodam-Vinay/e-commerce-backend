const { Schema, model } = require("mongoose");

const reviewSchema = new Schema(
  {
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
    title: {
      type: String,
    },
    body: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ReviewModel = model("Review", reviewSchema);
module.exports = ReviewModel;
