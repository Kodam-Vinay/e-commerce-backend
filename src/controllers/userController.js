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
  verifyOtp,
  sendOtp,
  userOrShopExistsWithIdOrEmailFunction,
} = require("../utils/constants");
const {
  VerificationEmailModel,
} = require("../../db/model/verificationEmailModel");
const { ProductModel } = require("../../db/model/productModel");
const { ShopModel } = require("../../db/model/shopModel");

const registerUser = async (req, res) => {
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

      const user = new UserModel({
        name,
        email,
        password: hashedPassword,
        reg_type,
        user_id:
          name?.split()?.length > 1
            ? name.split().join("") + generateOtp()
            : name + generateOtp(),
      });

      const verificationOtp = new VerificationEmailModel({
        user_shop: user?._id,
        modelType: "User",
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
        userOrShopDetails: sendUserDetails,
        message: "OTP sent Successfully",
      });
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const verifyUserOtp = async (req, res) => {
  try {
    const { userOrShopId, otp } = req.body;
    verifyOtp({ res, model: UserModel, userOrShopId, otp });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const sendUserOtp = async (req, res) => {
  try {
    const { userOrShopId } = req.body;
    sendOtp({ res, model: UserModel, userOrShopId });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email.toString().trim() || !password.toString().trim()) {
      return res.status(400).send({ message: "Fieds Should Not Be Empty" });
    }
    if (!validator.isEmail(email)) {
      const checkUserExistInUsers = await UserModel.findOne({ user_id: email });
      const checkShopExistInShops = await ShopModel.findOne({ shop_id: email });
      if (!checkUserExistInUsers && !checkShopExistInShops) {
        return res
          .status(404)
          .send({ message: "Entered User/Shop Id Not Found" });
      } else if (checkUserExistInUsers) {
        userOrShopExistsWithIdOrEmailFunction({
          res,
          password,
          email,
          model: UserModel,
          type: "user_id",
        });
      } else {
        userOrShopExistsWithIdOrEmailFunction({
          res,
          password,
          email,
          model: ShopModel,
          type: "shop_id",
        });
      }
    } else {
      const checkUserExistInUsers = await UserModel.findOne({ email });
      const checkShopExistInShops = await ShopModel.findOne({ email });
      if (!checkUserExistInUsers && !checkShopExistInShops) {
        return res.status(404).send({ message: "Entered Email Id Not Found" });
      } else if (checkUserExistInUsers) {
        userOrShopExistsWithIdOrEmailFunction({
          res,
          password,
          email,
          model: UserModel,
          type: "email",
        });
      } else {
        userOrShopExistsWithIdOrEmailFunction({
          res,
          password,
          email,
          model: ShopModel,
          type: "email",
        });
      }
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
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
      reg_type: "guest",
      user_id: name + generateOtp(),
      verified: true,
    });
    const userDetails = await user.save();
    const details = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      reg_type: userDetails?.reg_type,
    };
    const token = await generateJwtToken(details);

    const senduserDetails = {
      name: userDetails?.name,
      user_id: userDetails?.user_id,
      reg_type: userDetails?.reg_type,
      verified: userDetails?.verified,
      image: userDetails?.image,
      jwtToken: token,
    };
    res.status(200).send({ userOrShopDetails: senduserDetails });
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userOrShopDetails } = req.user;
    const requests = req.body;
    const model =
      userOrShopDetails?.reg_type === "seller" ? ShopModel : UserModel;
    const checkUserOrShopExist =
      userOrShopDetails?.reg_type === "seller"
        ? await model.findOne({
            shop_id: userOrShopDetails?.shop_id,
          })
        : await model.findOne({
            user_id: userOrShopDetails?.user_id,
          });

    if (!checkUserOrShopExist) {
      return res.status(400).send({ message: "User/Shop Not Exist" });
    }

    const checkUserOrShopIsVerified = checkUserOrShopExist?.verified;
    if (!checkUserOrShopIsVerified) {
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
        each === "is_premium_user"
      ) {
        // (userOrShopDetails?.reg_type === "seller" &&
        //   each === "shop_address") ||
        // (userOrShopDetails?.user_type === "seller" && each === "shop_name")
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

    if (
      (requests?.user_id &&
        checkUserOrShopExist?.user_id !== requests?.user_id) ||
      (requests?.shop_id && checkUserOrShopExist?.shop_id !== requests?.shop_id)
    ) {
      //if req has user id then check logged in user
      const findUserAlreadyExist =
        userOrShopDetails?.reg_type === "seller"
          ? await model.findOne({
              shop_id: requests?.shop_id,
            })
          : await model.findOne({
              user_id: requests?.user_id,
            });

      if (findUserAlreadyExist) {
        return res.status(400).send({
          message: "User/Shop Id Already Exist",
        });
      }
    }

    if (requests?.reg_type) {
      if (requests?.reg_type !== checkUserOrShopExist?.reg_type) {
        return res
          .status(400)
          .send({ message: "You are not allowed to change the type of user" });
      }
    }

    if (requests?.verified === true || requests?.verified === false) {
      if (requests?.verified !== checkUserOrShopExist?.verified) {
        return res
          .status(400)
          .send({ message: "You can verify your account by email validation" });
      }
    }

    if (requests?.oldPassword && requests?.newPassword) {
      //check old password not equal to new pass

      const findUser =
        userOrShopDetails?.reg_type === "seller"
          ? await model.findOne({
              shop_id: userOrShopDetails?.shop_id,
            })
          : await model.findOne({
              user_id: userOrShopDetails?.user_id,
            });

      if (!findUser) {
        return res.status(400).send({
          message: "User/Shop Not Exist",
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
      const updateUser = { ...checkUserOrShopExist._doc, ...req }; //getting response in {checkUserExist: {_doc: {userdetails}}}

      const checkAnyChangesMade =
        JSON.stringify(updateUser) !== JSON.stringify(checkUserOrShopExist);

      if (checkAnyChangesMade) {
        userOrShopDetails?.reg_type === "seller"
          ? await model.updateOne(
              { shop_id: checkUserOrShopExist?.shop_id },
              { $set: updateUser },
              { new: true }
            )
          : await model.updateOne(
              { user_id: checkUserOrShopExist?.user_id },
              { $set: updateUser },
              { new: true }
            );
        if (checkUserOrShopExist?.reg_type === "seller") {
          const filter = { seller_id: checkUserOrShopExist?.shop_id };
          const updateDoc = { seller_id: requests?.shop_id };
          await ProductModel.updateMany(filter, updateDoc);
        }
      }
    } else {
      const updateUser = { ...checkUserOrShopExist._doc, ...requests }; //getting response in {checkUserExist: {_doc: {userdetails}}}

      const checkAnyChangesMade =
        JSON.stringify(updateUser) !== JSON.stringify(checkUserOrShopExist);

      if (checkAnyChangesMade) {
        await UserModel.updateOne(
          { user_id: checkUserOrShopExist?.user_id },
          { $set: updateUser },
          { new: true }
        );
        if (checkUserOrShopExist?.reg_type === "seller") {
          const filter = { seller_id: checkUserOrShopExist?.shop_id };
          const updateDoc = { seller_id: requests?.shop_id };
          await ProductModel.updateMany(filter, updateDoc);
        }
      }
    }

    const userDetailsAfterUpdate =
      userOrShopDetails?.reg_type === "seller"
        ? await model.findOne({
            shop_id: requests?.shop_id,
          })
        : await model.findOne({
            user_id: requests?.user_id,
          });

    if (userOrShopDetails?.reg_type === "seller") {
      const details = {
        name: userDetailsAfterUpdate?.name,
        shop_id: userDetailsAfterUpdate?.shop_id,
        reg_type: userDetailsAfterUpdate?.reg_type,
      };

      const token = await generateJwtToken(details);

      const sendDetails = {
        name: userDetailsAfterUpdate?.name,
        shop_id: userDetailsAfterUpdate?.shop_id,
        reg_type: userDetailsAfterUpdate?.reg_type,
        verified: userDetailsAfterUpdate?.verified,
        image: userDetailsAfterUpdate?.image,
        shop_name: userDetailsAfterUpdate?.shop_name,
        shop_address: userDetailsAfterUpdate?.shop_address,
        jwtToken: token,
      };
      res.status(200).send({
        message: "User Details updated successfully",
        userOrShopDetails: sendDetails,
      });
    } else {
      const details = {
        name: userDetailsAfterUpdate?.name,
        user_id: userDetailsAfterUpdate?.user_id,
        reg_type: userDetailsAfterUpdate?.reg_type,
      };
      const token = await generateJwtToken(details);
      const sendDetails = {
        name: userDetailsAfterUpdate?.name,
        user_id: userDetailsAfterUpdate?.user_id,
        reg_type: userDetailsAfterUpdate?.reg_type,
        verified: userDetailsAfterUpdate?.verified,
        image: userDetailsAfterUpdate?.image,
        jwtToken: token,
      };
      res.status(200).send({
        message: "User Details updated successfully",
        userOrShopDetails: sendDetails,
      });
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userOrShopDetails } = req.user;
    const { user_shop_id } = req.body;
    const model =
      userOrShopDetails?.reg_type === "seller" ? ShopModel : UserModel;
    const findUser =
      userOrShopDetails?.reg_type === "seller"
        ? await model.findOne({
            shop_id: userOrShopDetails?.shop_id,
          })
        : await model.findOne({
            user_id: userOrShopDetails?.user_id,
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

    if (userOrShopDetails?.reg_type === "admin" && user_shop_id) {
      const findUserWithUserId = await model.findOne({
        user_id,
      });
      if (!findUserWithUserId) {
        return res.status(400).send({ message: "User Not Exist" });
      }
      await UserModel.findOneAndDelete({ user_id });
      res.status(200).send({ message: "User Deleted Successfully" });
    } else {
      if (userOrShopDetails?.reg_type === "admin") {
        return res
          .status(400)
          .send({ message: "You are trying to delete admin" });
      }
      await UserModel.findOneAndDelete({ user_id: userOrShopDetails?.user_id });
      res.status(200).send({ message: "User Deleted Successfully" });
    }
  } catch (error) {
    res.status(400).send({ message: "Something error is Happend" });
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
