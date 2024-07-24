const UserModel = require("../db/models/userModel");
const {
  REG_TYPES,
  preCheckValidations,
  ALLOWED_ROLES,
  makeHashText,
} = require("../utils/constants");

const getAllUsers = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { limit, page } = req.query;
    const skip = (page - 1) * limit;
    const users = await UserModel.find().skip(skip).limit(limit);
    const sendData = users
      ?.filter((eachUser) => eachUser?.user_id !== userDetails?.user_id)
      .map((eachUser) => {
        return {
          id: eachUser._id,
          name: eachUser.name,
          email: eachUser.email,
          role: eachUser.role,
          image: eachUser.image,
          address: eachUser.address,
          is_premium_user: eachUser.is_premium_user,
          verified: eachUser.verified,
        };
      });

    res.status(200).send({
      status: true,
      message: "Users Retrived Successfully",
      data: {
        users: sendData,
      },
    });
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const addNewUser = async (req, res) => {
  try {
    const {
      email,
      password,
      confirm_password,
      name,
      role,
      user_id,
      image,
      address,
    } = req.body;
    const response = await preCheckValidations({
      email,
      password,
      confirm_password,
      name,
      role,
      res,
      user_id,
      reg_type: role === ALLOWED_ROLES[1] ? REG_TYPES[0] : REG_TYPES[1],
    });
    if (response === true) {
      // hashing otp and password
      const hashedPassword = await makeHashText(password);

      const user = new UserModel({
        name,
        email,
        password: hashedPassword,
        role,
        user_id,
        image: image ? image : "DUMMY_PROFILE_LOGO.png",
        verified: true,
        address,
      });

      await user.save();

      res.status(201).send({
        status: true,
        message: "User Created Successfully",
      });
    }
  } catch (error) {
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

const deleteUserAdmin = async (req, res) => {
  try {
    const { userDetails } = req.user;
    const { _id } = req.body;
    if (!_id) {
      return res
        .status(400)
        .send({ status: false, message: "User Id Not Found" });
    }
    const user = await UserModel.findById(_id);
    if (!user) {
      return res.status(400).send({ status: false, message: "User Not Found" });
    }
    if (user.user_id === userDetails.user_id) {
      return res
        .status(400)
        .send({ status: false, message: "You Can't Delete Yourself" });
    }

    await UserModel.findOneAndDelete({ _id: _id });
    res
      .status(200)
      .send({ status: true, message: "User Deleted Successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).send({ status: false, message: "Something Went Wrong" });
  }
};

module.exports = {
  getAllUsers,
  deleteUserAdmin,
  addNewUser,
};
