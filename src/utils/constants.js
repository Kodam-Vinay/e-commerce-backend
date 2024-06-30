require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createTransport } = require("nodemailer");
const validator = require("validator");
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

const generateJwtToken = async (userDetails) => {
  return jwt.sign({ userDetails }, process.env.SECRET_KEY);
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
  user_type,
  model,
  res,
}) => {
  if (!email || !password || !confirm_password || !name || !user_type) {
    return res.status(400).send({ message: "Fields must not to be Empty" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).send({ message: "Email is Invalid" });
  }
  const userOrShopNameExistsWithEmail = await model.findOne({ email });
  if (userOrShopNameExistsWithEmail) {
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
};

module.exports = {
  MONGO_URL,
  generateOtp,
  makeHashText,
  nodemailerTransport,
  verifyOtpAndPassword,
  generateJwtToken,
  sendMail,
  authorizeUser,
  generateRandomEmailandUserId,
  preCheckValidations,
};
