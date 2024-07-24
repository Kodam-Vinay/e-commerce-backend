require("dotenv").config();
const validator = require("validator");
const UserModel = require("../db/models/userModel");
const VerificationEmailModel = require("../db/models/verificationEmailModel");
const ProductModel = require("../db/models/productModel");
const {
  generateOtp,
  makeHashText,
  verifyOtpAndPassword,
  generateJwtToken,
  sendMail,
  generateRandomEmailandUserId,
  preCheckValidations,
  verifyOtp,
  sendOtp,
  REG_TYPES,
  loginUserFunction,
} = require("../utils/constants");

const registerUser = async (req, res) => {
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
      reg_type: REG_TYPES[1],
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

const verifyUserOtp = async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    verifyOtp({
      res,
      user_id,
      otp,
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const sendUserOtp = async (req, res) => {
  try {
    const { user_id } = req.body;
    sendOtp({ res, user_id });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const loginUser = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const loginAsGuest = async (req, res) => {
  try {
    const { email, name } = generateRandomEmailandUserId();
    const hashedPassword = await makeHashText(email);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: "guest",
      user_id: name + generateOtp(),
      verified: true,
    });
    const userDetails = await user.save();
    const details = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      role: userDetails?.role,
    };
    const model = UserModel;
    const token = await generateJwtToken(details);

    const senduserDetails = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      role: userDetails?.role,
      verified: userDetails?.verified,
      image: userDetails?.image,
      jwtToken: token,
    };
    res.status(200).send({
      status: true,
      message: "Login Successfully",
      data: {
        userDetails: senduserDetails,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const requests = req.body;

    if (Object.keys(requests).length === 0) {
      return res
        .status(400)
        .send({ message: "Update Requests Should not be empty" });
    }

    const checkUserExist = UserModel.findOne({ user_id: userDetails?.user_id });

    if (!checkUserExist) {
      return res.status(400).send({ message: "User Not Exist" });
    }

    const checkUserIsVerified = checkUserExist?.verified;
    if (!checkUserIsVerified) {
      return res
        .status(400)
        .send({ status: false, message: "User is Not Verified or Not Valid" });
    }

    let result = false;

    Object.keys(requests).forEach((each) => {
      if (
        each === "old_password" ||
        each === "new_password" ||
        each === "is_premium_user"
      ) {
        return;
      }
      if (!checkUserOrShopExist[each]) {
        result = true;
      }
    });

    if (result) {
      return res.status(400).send({
        message: "Your trying to update the property which not exist",
      });
    }

    if (requests?.user_id && checkUserExist?.user_id !== requests?.user_id) {
      //if req has user id then check logged in user //updating user_id
      const findUserIdAlreadyExist = UserModel.findOne({
        user_id: requests?.user_id,
      });

      if (findUserIdAlreadyExist) {
        return res.status(400).send({
          message: "Enterd User Id Already Exist ! Please try an new User Id",
        });
      }
    }

    if (requests?.role) {
      if (requests?.role !== checkUserExist?.role) {
        return res
          .status(400)
          .send({ message: "You are not allowed to change the type of user" });
      }
    }

    if (requests?.verified === true || requests?.verified === false) {
      if (requests?.verified !== checkUserExist?.verified) {
        return res
          .status(400)
          .send({ message: "You can verify your account by email validation" });
      }
    }

    if (requests?.oldPassword && requests?.newPassword) {
      //check old password not equal to new pass

      if (requests?.oldPassword === requests?.newPassword) {
        return res.status(400).send({
          message: "Current Password Should not be same as Old Password",
        });
      }

      const checkOldPassword = await verifyOtpAndPassword(
        checkUserExist?.password,
        requests?.oldPassword
      );

      if (!checkOldPassword) {
        return res
          .status(400)
          .send({ message: "Please Check Your Old Password" });
      }

      if (!validator.isStrongPassword(requests?.newPassword)) {
        return res.status(400).send({
          message:
            "Password Not Meet the criteria, it Must includes(password length 8 or more charaters, 1 uppercase letter, 1 special symbol)",
        });
      }
      const hashedPassword = await makeHashText(requests?.newPassword);
      delete requests?.oldPassword, requests?.newPassword;

      const req = {
        ...requests,
        password: hashedPassword,
      };
      const updateUser = { ...checkUserExist._doc, ...req }; //getting response in {checkUserExist: {_doc: {userdetails}}}

      const checkAnyChangesMade =
        JSON.stringify(updateUser) !== JSON.stringify(checkUserExist);

      if (checkAnyChangesMade) {
        await UserModel.updateOne(
          { user_id: checkUserExist?.user_id },
          { $set: updateUser },
          { new: true }
        );
        if (checkUserExist?.role === "seller") {
          const filter = { seller_id: checkUserExist?.user_id };
          const updateDoc = { seller_id: requests?.user_id };
          await ProductModel.updateMany(filter, updateDoc);
        }
      }
    } else {
      const updateUser = { ...checkUserExist._doc, ...requests }; //getting response in {checkUserExist: {_doc: {userdetails}}}

      const checkAnyChangesMade =
        JSON.stringify(updateUser) !== JSON.stringify(checkUserExist);

      if (checkAnyChangesMade) {
        await UserModel.updateOne(
          { user_id: checkUserExist?.user_id },
          { $set: updateUser },
          { new: true }
        );
        if (checkUserExist?.role === "seller") {
          const filter = { seller_id: checkUserExist?.user_id };
          const updateDoc = { seller_id: requests?.user_id };
          await ProductModel.updateMany(filter, updateDoc);
        }
      }
    }

    const userDetailsAfterUpdate = await UserModel.findOne({
      user_id: requests?.user_id,
    });

    const details = {
      name: userDetailsAfterUpdate?.name,
      user_id: userDetailsAfterUpdate?.user_id,
      role: userDetailsAfterUpdate?.role,
    };
    const token = await generateJwtToken(details);
    const sendDetails = {
      name: userDetailsAfterUpdate?.name,
      user_id: userDetailsAfterUpdate?.user_id,
      role: userDetailsAfterUpdate?.role,
      verified: userDetailsAfterUpdate?.verified,
      image: userDetailsAfterUpdate?.image,
      jwtToken: token,
    };
    res.status(200).send({
      status: true,
      message: "User Details updated successfully",
      data: {
        userDetails: sendDetails,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { user_id } = req.body;

    const findUser = UserModel.findOne({ user_id: userDetails?.user_id });

    if (!findUser) {
      return res.status(400).send({ message: "User Not Exist" });
    }
    const checkUserIsVerified = findUser?.verified;
    if (!checkUserIsVerified) {
      return res
        .status(400)
        .send({ status: false, message: "User is Not Verified or Not Valid" });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyUserOtp,
  updateUser,
  loginAsGuest,
  deleteUser,
  sendUserOtp,
};
