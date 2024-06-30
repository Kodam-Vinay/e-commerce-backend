const { ShopModel } = require("../db/model/shopModel");
const {
  VerificationEmailModel,
} = require("../db/model/verificationEmailModel");
const { generateOtp, preCheckValidations } = require("../src/utils/constants");

const registerShop = async (req, res) => {
  try {
    const { email, password, confirm_password, name, user_type } = req.body;
    await preCheckValidations({
      email,
      password,
      confirm_password,
      name,
      user_type,
      model: ShopModel,
      res,
    });
    const shop = new ShopModel({
      name,
      email,
      password: hashedPassword,
      user_type,
      shop_id: name + generateOtp(),
      address: "dummy",
    });
    const token = new VerificationEmailModel({
      user_shop: shop?._id,
      otp: hashedOtp,
    });

    const shopDetails = await shop.save();
    await token.save();
    await sendMail(shopDetails?.email, otp, shopDetails?.name);

    const sendUserDetails = {
      id: shopDetails?._id,
      name: shopDetails?.name,
      verified: shopDetails?.verified,
    };

    return res.status(201).send({
      userDetails: sendUserDetails,
      message: "OTP sent Successfully",
    });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

module.exports = {
  registerShop,
};
