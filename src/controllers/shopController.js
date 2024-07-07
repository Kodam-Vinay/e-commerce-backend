const { ShopModel } = require("../../db/model/shopModel");
const {
  VerificationEmailModel,
} = require("../../db/model/verificationEmailModel");
const {
  generateOtp,
  sendMail,
  preCheckValidations,
  makeHashText,
  verifyOtp,
  sendOtp,
} = require("../utils/constants");

const registerShop = async (req, res) => {
  try {
    const { email, password, confirm_password, name, reg_type } = req.body;
    const response = await preCheckValidations({
      email,
      password,
      confirm_password,
      name,
      reg_type,
      res,
    });
    if (response === true) {
      //generating otp
      const otp = generateOtp();

      // hashing otp and password
      const hashedPassword = await makeHashText(password);
      const hashedOtp = await makeHashText(otp);

      const shop = new ShopModel({
        name,
        email,
        password: hashedPassword,
        reg_type,
        shop_id: name + generateOtp(),
        address: "dummy",
      });
      const verificationOtp = new VerificationEmailModel({
        user_shop: shop?._id,
        modelType: "Shop",
        otp: hashedOtp,
      });

      const shopDetails = await shop.save();
      await verificationOtp.save();
      await sendMail(shopDetails?.email, otp, shopDetails?.name);

      const sendUserDetails = {
        id: shopDetails?._id,
        name: shopDetails?.name,
        verified: shopDetails?.verified,
      };

      return res.status(201).send({
        userOrShopDetails: sendUserDetails,
        message: "OTP sent Successfully",
      });
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const verifyShopOtp = async (req, res) => {
  try {
    const { userOrShopId, otp } = req.body;
    verifyOtp({ res, model: ShopModel, userOrShopId, otp });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const sendShopOtp = async (req, res) => {
  try {
    const { userOrShopId } = req.body;
    sendOtp({ res, model: ShopModel, userOrShopId });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

module.exports = {
  registerShop,
  verifyShopOtp,
  sendShopOtp,
};
