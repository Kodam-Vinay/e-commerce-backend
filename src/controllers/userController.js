require("dotenv").config();
const validator = require("validator");
const { UserModel } = require("../../db/model/UserModel");
const {
  generateOtp,
  makeHashText,
  verifyOtpAndPassword,
  generateJwtToken,
  sendMail,
  generateRandomEmailandUserId,
  preCheckValidations,
} = require("../utils/constants");
const {
  VerificationEmailModel,
} = require("../../db/model/verificationEmailModel");
const { ProductModel } = require("../../db/model/productModel");
const { ShopModel } = require("../../db/model/shopModel");

const registerUser = async (req, res) => {
  try {
    const { email, password, confirm_password, name, user_type } = req.body;
    await preCheckValidations({
      email,
      password,
      confirm_password,
      name,
      user_type,
      model: UserModel,
      res,
    });

    //generating otp
    const otp = generateOtp();

    // hashing otp and password
    const hashedPassword = await makeHashText(password);
    const hashedOtp = await makeHashText(otp);

    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      user_type,
      user_id: name + generateOtp(),
    });

    const token = new VerificationEmailModel({
      user_shop: user?._id,
      otp: hashedOtp,
    });
    const userDetails = await user.save();
    await token.save();
    await sendMail(userDetails?.email, otp, userDetails?.name);

    const sendUserDetails = {
      id: userDetails?._id,
      name: userDetails?.name,
      verified: userDetails?.verified,
    };

    res
      .status(201)
      .send({ userDetails: sendUserDetails, message: "OTP sent Successfully" });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { user, otp } = req.body;

    if (!user || !otp.trim()) {
      return res.status(400).send({
        message: "Fields Should not be empty",
      });
    }

    const checkUserExist = await UserModel.findOne({ _id: user });
    if (!checkUserExist) {
      return res.status(400).send({
        message: "User Not Exists",
      });
    }

    if (checkUserExist?.verified) {
      return res.status(400).send({
        message: "User Already Verified",
      });
    }

    const findUserExistsOtp = await VerificationEmailModel.findOne({
      user: checkUserExist?._id,
    });

    if (!findUserExistsOtp) {
      return res.status(400).send({
        message: "OTP Expired, Make Another OTP Request",
      });
    }

    const result = await verifyOtpAndPassword(findUserExistsOtp?.otp, otp);
    if (!result) {
      return res.status(400).send({
        message: "Otp is invalid",
      });
    }
    checkUserExist.verified = true;
    await VerificationEmailModel.findByIdAndDelete(findUserExistsOtp?._id);
    const userDetails = await checkUserExist.save();
    const details = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      user_type: userDetails?.user_type,
    };
    const token = await generateJwtToken(details);
    if (userDetails?.user_type === "seller") {
      const checkSellerShopDetails = await ShopModel.findOne({
        user: userDetails?._id,
      });
      if (!checkSellerShopDetails) {
        return res.status(400).send({
          message: "Your Not Authorized Seller",
        });
      }
      const sendDetails = {
        name: userDetails?.name,
        user_id: userDetails?.user_id,
        user_type: userDetails?.user_type,
        verified: userDetails?.verified,
        image: userDetails?.image,
        shop_name: checkSellerShopDetails?.shop_name,
        shop_address: checkSellerShopDetails?.shop_address,
        jwtToken: token,
      };
      return res.status(200).send({ userDetails: sendDetails });
    }
    const sendDetails = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      user_type: userDetails?.user_type,
      verified: userDetails?.verified,
      image: userDetails?.image,
      jwtToken: token,
    };
    res.status(200).send({ userDetails: sendDetails });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { user } = req.body;

    if (!user) {
      return res.status(400).send({
        message: "Fields Should not be empty",
      });
    }

    const checkUserExist = await UserModel.findOne({ _id: user });

    if (!checkUserExist) {
      return res.status(400).send({
        message: "User Not Exists",
      });
    }

    if (checkUserExist?.verified) {
      return res.status(400).send({
        message: "User Already Verified",
      });
    }

    const checkVerificationExists = await VerificationEmailModel.findOne({
      user: checkUserExist?._id,
    });

    if (checkVerificationExists) {
      return res.status(400).send({
        message:
          "Please wait 5 mins to make another otp Request (Or) Check Ur Recent Otp Mail",
      });
    }

    const otp = generateOtp();
    const hashedOtp = await makeHashText(otp);
    const token = new VerificationEmailModel({
      user: checkUserExist?._id,
      otp: hashedOtp,
    });
    await token.save();
    await sendMail(checkUserExist?.email, otp, checkUserExist?.name);
    res.status(200).send({
      message: "OTP sent Successfully",
    });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!validator.isEmail(email)) {
      userExistsWithIdOrEmailFunction(res, password, email, "user_id");
    } else {
      userExistsWithIdOrEmailFunction(res, password, email, "email");
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

async function userExistsWithIdOrEmailFunction(res, password, email, type) {
  try {
    const userExistWithIdOrEmail = await UserModel.findOne({ [type]: email });
    if (!userExistWithIdOrEmail) {
      return res
        .status(400)
        .send({ message: "Please Enter a Valid User Id or Email" });
    } else {
      const checkPassword = await verifyOtpAndPassword(
        userExistWithIdOrEmail?.password,
        password
      );
      if (!checkPassword) {
        return res.status(400).send({ message: "Please Check Your Password" });
      }
      if (userExistWithIdOrEmail?.verified) {
        const details = {
          name: userExistWithIdOrEmail?.name,
          user_id: userExistWithIdOrEmail?.user_id,
          user_type: userExistWithIdOrEmail?.user_type,
        };
        const token = await generateJwtToken(details);
        const userDetails = {
          name: userExistWithIdOrEmail?.name,
          user_id: userExistWithIdOrEmail?.user_id,
          user_type: userExistWithIdOrEmail?.user_type,
          verified: userExistWithIdOrEmail?.verified,
          image: userExistWithIdOrEmail?.image,
          jwtToken: token,
        };
        res.status(200).send({ userDetails });
      } else {
        const checkVerificationExists = await VerificationEmailModel.findOne({
          user: userExistWithIdOrEmail?._id,
        });
        if (!checkVerificationExists) {
          const otp = generateOtp();
          const hashedOtp = await makeHashText(otp);
          const token = new VerificationEmailModel({
            user: userExistWithIdOrEmail?._id,
            otp: hashedOtp,
          });
          await token.save();
          await sendMail(
            userExistWithIdOrEmail?.email,
            otp,
            userExistWithIdOrEmail?.name
          );
          const sendUserDetails = {
            id: userExistWithIdOrEmail?._id,
            name: userExistWithIdOrEmail?.name,
            verified: userExistWithIdOrEmail?.verified,
          };
          res.status(200).send({
            userDetails: sendUserDetails,
            message: "OTP sent Successfully",
          });
        } else {
          const sendUserDetails = {
            id: userExistWithIdOrEmail?._id,
            name: userExistWithIdOrEmail?.name,
            verified: userExistWithIdOrEmail?.verified,
          };
          res.status(200).send({
            userDetails: sendUserDetails,
            message: "OTP sent Successfully",
          });
        }
      }
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
}

const loginAsGuest = async (req, res) => {
  try {
    const { email, name } = generateRandomEmailandUserId();
    const hashedPassword = await makeHashText(email);
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      user_type: "guest",
      user_id: name + generateOtp(),
      verified: true,
    });
    const userDetails = await user.save();
    const details = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      user_type: userDetails?.user_type,
    };
    const token = await generateJwtToken(details);

    const senduserDetails = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      user_type: userDetails?.user_type,
      verified: userDetails?.verified,
      image: userDetails?.image,
      jwtToken: token,
    };
    res.status(200).send({ userDetails: senduserDetails });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const requests = req.body;
    const checkUserExist = await UserModel.findOne({
      user_id: userDetails?.user_id,
    });

    const checkUserIsVerified = checkUserExist?.verified;
    if (!checkUserIsVerified) {
      return res
        .status(400)
        .send({ message: "User is Not Verified or Not Valid" });
    }

    if (Object.keys(requests).length === 0) {
      return res.status(400).send({ message: "Requests Should not be empty" });
    }

    let result = false;

    Object.keys(requests).forEach((each) => {
      if (
        each === "oldPassword" ||
        each === "newPassword" ||
        each === "is_premium_user" ||
        (userDetails?.user_type === "seller" && each === "shop_address") ||
        (userDetails?.user_type === "seller" && each === "shop_name")
      ) {
        return;
      }
      if (!checkUserExist[each]) {
        result = true;
      }
    });

    if (result) {
      return res.status(400).send({
        message: "Your trying to update the property which not exist",
      });
    }

    if (requests?.user_id && checkUserExist?.user_id !== requests?.user_id) {
      //if req has user id then check logged in user
      const findUserAlreadyExist = await UserModel.findOne({
        user_id: requests?.user_id,
      });
      if (findUserAlreadyExist) {
        return res.status(400).send({
          message: "User Id Already Exist",
        });
      }
    }

    if (requests?.user_type) {
      if (requests?.user_type !== checkUserExist?.user_type) {
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

      const findUser = await UserModel.findOne({
        user_id: userDetails?.user_id,
      });
      if (!findUser) {
        return res.status(400).send({
          message: "User Not Exist",
        });
      }
      if (requests?.oldPassword === requests?.newPassword) {
        return res.status(400).send({
          message: "Current Password Should not be same as Old Password",
        });
      }

      const checkOldPassword = await verifyOtpAndPassword(
        findUser?.password,
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
        if (checkUserExist?.user_type === "seller") {
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
      user_type: userDetailsAfterUpdate?.user_type,
    };

    const token = await generateJwtToken(details);

    const sendDetails = {
      name: userDetailsAfterUpdate?.name,
      user_id: userDetailsAfterUpdate?.user_id,
      user_type: userDetailsAfterUpdate?.user_type,
      verified: userDetailsAfterUpdate?.verified,
      image: userDetailsAfterUpdate?.image,
      jwtToken: token,
    };
    res.status(200).send({
      message: "User Details updated successfully",
      userDetails: sendDetails,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { user_id } = req.body;
    const findUser = await UserModel.findOne({
      user_id: userDetails?.user_id,
    });
    if (!findUser) {
      return res.status(400).send({ message: "User Not Exist" });
    }
    const checkUserIsVerified = findUser?.verified;
    if (!checkUserIsVerified) {
      return res
        .status(400)
        .send({ message: "User is Not Verified or Not Valid" });
    }

    if (userDetails?.user_type === "admin" && user_id) {
      const findUserWithUserId = await UserModel.findOne({
        user_id,
      });
      if (!findUserWithUserId) {
        return res.status(400).send({ message: "User Not Exist" });
      }
      await UserModel.findOneAndDelete({ user_id });
      res.status(200).send({ message: "User Deleted Successfully" });
    } else {
      if (userDetails?.user_type === "admin") {
        return res
          .status(400)
          .send({ message: "You are trying to delete admin" });
      }
      await UserModel.findOneAndDelete({ user_id: userDetails?.user_id });
      res.status(200).send({ message: "User Deleted Successfully" });
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  sendOtp,
  updateUser,
  loginAsGuest,
  deleteUser,
};
