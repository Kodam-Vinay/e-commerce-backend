require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createTransport } = require("nodemailer");
const validator = require("validator");
const {
  VerificationEmailModel,
} = require("../../db/model/verificationEmailModel");
const { ShopModel } = require("../../db/model/shopModel");
const { UserModel } = require("../../db/model/UserModel");
const MONGO_URL = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster8.lcc0un1.mongodb.net/e-commerce`;

const generateOtp = () => {
  let otp = "";
  for (let i = 0; i < 4; i++) {
    const randomVal = Math.round(Math.random() * 9);
    otp += randomVal;
  }
  return otp;
};

const makeHashText = async (text) => {
  if (!text) {
    return;
  }
  let hashedText = "";
  try {
    const salt = parseInt(process.env.SALT_ROUNDS);
    const genSalt = await bcrypt.genSalt(salt);
    hashedText = await bcrypt.hash(text, genSalt);
  } catch (error) {
    console.log(error);
  }
  return hashedText;
};

const nodemailerTransport = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_NAME_SMTP,
    pass: process.env.PASSWORD_SMTP,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const verifyOtpAndPassword = async (passwordOrOtp, enteredPassOrOtp) => {
  let result = false;
  try {
    result = await bcrypt.compare(enteredPassOrOtp.trim(), passwordOrOtp);
  } catch (error) {
    console.log(error);
  }
  return result;
};

const generateJwtToken = (userOrShopDetails) => {
  return jwt.sign({ userOrShopDetails }, process.env.SECRET_KEY);
};

const sendMail = async (email, otp, name) => {
  await nodemailerTransport.sendMail({
    from: process.env.USER_NAME_SMTP,
    to: email,
    subject: "Verification of Your Email Account",
    html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Email Verification</a>
      </div>
      <p style="font-size:1.1em">Hi, ${name}</p>
      <p>Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
      <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
      <p style="font-size:0.9em;">Regards,<br />Vinay Kumar Kodam</p>
      <hr style="border:none;border-top:1px solid #eee" />
    </div>
  </div>`,
  });
};

const authorizeUser = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const jwtToken = authHeader.split(" ")[1];
    jwt.verify(jwtToken, process.env.SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized User" });
      }
      req.user = decoded;
      next();
    });
  } else {
    res.status(401).send({ message: "Unauthorized User" });
  }
};

const generateRandomNum = (length) => {
  return Math.ceil(Math.round(Math.random() * length)) - 1;
};

const generateRandomEmailandUserId = () => {
  const alphabates = "abcdefghijklmnopqrstuvwxyz";
  let randWord = "";
  for (let i = 0; i <= 5; i++) {
    const randomNum = generateRandomNum(alphabates.length);
    randWord += alphabates[randomNum];
  }

  return {
    email: "Test" + randWord + generateRandomNum(99) + "@gmail.com",
    name: "test" + randWord,
  };
};

const preCheckValidations = async ({
  email,
  password,
  confirm_password,
  name,
  reg_type,
  res,
}) => {
  let result = false;
  if (
    !email.toString().trim() ||
    !password.toString().trim() ||
    !confirm_password.toString().trim() ||
    !name.toString().trim() ||
    !reg_type.toString().trim()
  ) {
    return res.status(400).send({ message: "Fields must not to be Empty" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).send({ message: "Email is Invalid" });
  }
  const userOrShopNameExistsWithEmailInShop = await ShopModel.findOne({
    email,
  });
  if (userOrShopNameExistsWithEmailInShop) {
    return res.status(400).send({ message: "User Email Already Exists" });
  }
  const userOrShopNameExistsWithEmailInUsers = await UserModel.findOne({
    email,
  });
  if (userOrShopNameExistsWithEmailInUsers) {
    return res.status(400).send({ message: "User Email Already Exists" });
  }

  if (password !== confirm_password) {
    return res.status(400).send({
      message: "Both Passwords should Match",
    });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(400).send({
      message:
        "Password Not Meet the criteria, it Must includes(password length 8 or more charaters, 1 uppercase letter, 1 special symbol)",
    });
  }
  result = true;
  return result;
};

const verifyOtp = async ({ res, model, userOrShopId, otp }) => {
  try {
    if (!userOrShopId || !otp.trim()) {
      return res.status(400).send({
        message: "Fields Should not be empty",
      });
    }
    const checkUserOrShopExist = await model.findOne({ _id: userOrShopId });

    if (!checkUserOrShopExist) {
      return res.status(404).send({
        message: model === ShopModel ? "Shop Not Exists" : "User Not Exists",
      });
    }

    if (checkUserOrShopExist?.verified) {
      return res.status(400).send({
        message:
          model === ShopModel
            ? "Shop Already Verified"
            : "User Already Verified",
      });
    }

    const findUserOrShopExistsOtp = await VerificationEmailModel.findOne({
      user_shop: checkUserOrShopExist?._id,
      modelType: model === ShopModel ? "Shop" : "User",
    });

    if (!findUserOrShopExistsOtp) {
      return res.status(404).send({
        message: "OTP Expired, Make Another OTP Request",
      });
    }

    const result = await verifyOtpAndPassword(
      findUserOrShopExistsOtp?.otp,
      otp
    );

    if (!result) {
      return res.status(400).send({
        message: "Otp is invalid",
      });
    }
    checkUserOrShopExist.verified = true;
    await VerificationEmailModel.findByIdAndDelete(
      findUserOrShopExistsOtp?._id
    );

    const userOrShopDetails = await checkUserOrShopExist.save();

    if (model === ShopModel) {
      const details = {
        name: userOrShopDetails?.name,
        shop_id: userOrShopDetails?.shop_id,
        reg_type: userOrShopDetails?.reg_type,
      };
      const token = await generateJwtToken(details);
      const sendDetails = {
        name: userOrShopDetails?.name,
        shop_id: userOrShopDetails?.shop_id,
        reg_type: userOrShopDetails?.reg_type,
        verified: userOrShopDetails?.verified,
        image: userOrShopDetails?.image,
        shop_name: userOrShopDetails?.shop_name,
        shop_address: userOrShopDetails?.shop_address,
        jwtToken: token,
      };
      return res.status(200).send({ userOrShopDetails: sendDetails });
    }
    const details = {
      name: userOrShopDetails?.name,
      user_id: userOrShopDetails?.user_id,
      reg_type: userOrShopDetails?.reg_type,
    };
    const token = await generateJwtToken(details);
    const sendDetails = {
      name: userOrShopDetails?.name,
      user_id: userOrShopDetails?.user_id,
      reg_type: userOrShopDetails?.reg_type,
      verified: userOrShopDetails?.verified,
      image: userOrShopDetails?.image,
      jwtToken: token,
    };
    res.status(200).send({ userOrShopDetails: sendDetails });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const sendOtp = async ({ res, model, userOrShopId }) => {
  try {
    if (!userOrShopId) {
      return res.status(400).send({
        message: "Fields Should not be empty",
      });
    }

    const checkUserOrShopExist = await model.findOne({ _id: userOrShopId });

    if (!checkUserOrShopExist) {
      return res.status(400).send({
        message: model === ShopModel ? "Shop Not Exists" : "User Not Exists",
      });
    }

    if (checkUserOrShopExist?.verified) {
      return res.status(400).send({
        message:
          model === ShopModel
            ? "Shop Already Verified"
            : "User Already Verified",
      });
    }

    const findUserOrShopExistsOtp = await VerificationEmailModel.findOne({
      user_shop: checkUserOrShopExist?._id,
      modelType: model === ShopModel ? "Shop" : "User",
    });

    if (findUserOrShopExistsOtp) {
      return res.status(400).send({
        message:
          "Please wait 5 mins to make another otp Request (Or) Check Ur Recent Otp Mail",
      });
    }

    const otp = generateOtp();
    const hashedOtp = await makeHashText(otp);
    const verificationOtp = new VerificationEmailModel({
      user_shop: checkUserOrShopExist?._id,
      modelType: model === ShopModel ? "Shop" : "User",
      otp: hashedOtp,
    });
    await verificationOtp.save();
    await sendMail(
      checkUserOrShopExist?.email,
      otp,
      checkUserOrShopExist?.name
    );
    res.status(200).send({
      message: "OTP sent Successfully",
    });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const userOrShopExistsWithIdOrEmailFunction = async ({
  res,
  password,
  email,
  model,
  type,
}) => {
  try {
    const checkUserOrShopExist = await model.findOne({ [type]: email });

    const checkPassword = await verifyOtpAndPassword(
      checkUserOrShopExist?.password,
      password
    );
    if (!checkPassword) {
      return res.status(400).send({ message: "Please Check Your Password" });
    }
    if (checkUserOrShopExist?.verified) {
      if (model === ShopModel) {
        const details = {
          name: checkUserOrShopExist?.name,
          shop_id: checkUserOrShopExist?.shop_id,
          reg_type: checkUserOrShopExist?.reg_type,
        };
        const token = await generateJwtToken(details);
        const sendDetails = {
          name: checkUserOrShopExist?.name,
          shop_id: checkUserOrShopExist?.shop_id,
          reg_type: checkUserOrShopExist?.reg_type,
          verified: checkUserOrShopExist?.verified,
          image: checkUserOrShopExist?.image,
          shop_name: checkUserOrShopExist?.shop_name,
          shop_address: checkUserOrShopExist?.shop_address,
          jwtToken: token,
        };
        return res.status(200).send({ userOrShopDetails: sendDetails });
      }
      const details = {
        name: checkUserOrShopExist?.name,
        user_id: checkUserOrShopExist?.user_id,
        reg_type: checkUserOrShopExist?.reg_type,
      };
      const token = await generateJwtToken(details);
      const sendDetails = {
        name: checkUserOrShopExist?.name,
        user_id: checkUserOrShopExist?.user_id,
        reg_type: checkUserOrShopExist?.reg_type,
        verified: checkUserOrShopExist?.verified,
        image: checkUserOrShopExist?.image,
        jwtToken: token,
      };
      res.status(200).send({ userOrShopDetails: sendDetails });
    } else {
      const findUserOrShopExistsOtp = await VerificationEmailModel.findOne({
        user_shop: checkUserOrShopExist?._id,
        modelType: model === ShopModel ? "Shop" : "User",
      });
      if (!findUserOrShopExistsOtp) {
        const otp = generateOtp();
        const hashedOtp = await makeHashText(otp);
        const verificationOtp = new VerificationEmailModel({
          user_shop: checkUserOrShopExist?._id,
          modelType: model === ShopModel ? "Shop" : "User",
          otp: hashedOtp,
        });
        await verificationOtp.save();
        await sendMail(
          checkUserOrShopExist?.email,
          otp,
          checkUserOrShopExist?.name
        );
        const sendUserDetails = {
          id: checkUserOrShopExist?._id,
          name: checkUserOrShopExist?.name,
          verified: checkUserOrShopExist?.verified,
        };
        res.status(200).send({
          userOrShopDetails: sendUserDetails,
          message: "OTP sent Successfully",
        });
      } else {
        const sendUserDetails = {
          id: checkUserOrShopExist?._id,
          name: checkUserOrShopExist?.name,
          verified: checkUserOrShopExist?.verified,
        };
        res.status(200).send({
          userOrShopDetails: sendUserDetails,
          message: "Please Enter The Previous OTP.",
        });
      }
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

module.exports = {
  MONGO_URL,
  generateOtp,
  makeHashText,
  verifyOtpAndPassword,
  generateJwtToken,
  sendMail,
  authorizeUser,
  generateRandomEmailandUserId,
  preCheckValidations,
  verifyOtp,
  sendOtp,
  userOrShopExistsWithIdOrEmailFunction,
};
