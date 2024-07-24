const validator = require("validator");
const VerificationEmailModel = require("../db/models/verificationEmailModel");
const UserModel = require("../db/models/userModel");
const {
  generateOtp,
  sendMail,
  preCheckValidations,
  makeHashText,
  verifyOtp,
  sendOtp,
  REG_TYPES,
  loginUserFunction,
} = require("../utils/constants");

const registerShopOrAdmin = async (req, res) => {
  try {
    const { email, password, confirm_password, name, role, user_id, image } =
      req.body;
    const response = await preCheckValidations({
      email,
      password,
      confirm_password,
      name,
      role,
      res,
      user_id,
      reg_type: REG_TYPES[0],
    });
    if (response === true) {
      //generating otp
      const otp = generateOtp();

      // hashing otp and password
      const hashedPassword = await makeHashText(password);
      const hashedOtp = await makeHashText(otp);

      const user = new UserModel({
        name,
        email,
        password: hashedPassword,
        role,
        user_id,
        image: image ? image : "DUMMY_PROFILE_LOGO.png",
      });

      const verificationOtp = new VerificationEmailModel({
        user_id: user?._id,
        otp: hashedOtp,
      });

      const userDetails = await user.save();
      await verificationOtp.save();
      await sendMail(userDetails?.email, otp, userDetails?.name);

      const sendUserDetails = {
        id: userDetails?._id,
        name: userDetails?.name,
        verified: userDetails?.verified,
      };
      res.status(201).send({
        status: true,
        message: "OTP sent Successfully",
        data: {
          userDetails: sendUserDetails,
        },
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const verifyShopOrAdminOtp = async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    await verifyOtp({
      res,
      user_id,
      otp,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const sendShopOrAdminOtp = async (req, res) => {
  try {
    const { user_id } = req.body;
    await sendOtp({ res, user_id });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const loginShopAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.toString().trim() || !password?.toString().trim()) {
      return res
        .status(400)
        .send({ status: false, message: "Fieds Should Not Be Empty" });
    }
    if (!validator.isEmail(email)) {
      await loginUserFunction({
        res,
        password,
        email,
        type: "user_id",
      });
    } else {
      await loginUserFunction({
        res,
        password,
        email,
        type: "email",
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  registerShopOrAdmin,
  verifyShopOrAdminOtp,
  sendShopOrAdminOtp,
  loginShopAdmin,
};
