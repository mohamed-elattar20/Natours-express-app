const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  // Send Response
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
});
exports.createUser = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      results: 10,
      data: 'Users',
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
exports.getUserById = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      results: 10,
      data: 'Users',
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};

// For the user himsel to update just specfic parts of his data (name , email)
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user sent password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'this route is not for password update please use /updateMyPassword',
        400,
      ),
    );

  // 2) Filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user Document

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // to return the newly updated user object
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// For only Admin to update all the user's data
// we don't update password with this as findByIdAndUpdate doesn't run the save middleware
exports.updateUser = factory.updateOne(User);

//  function to delete or in another meaning to deactive my account (normal user's account)
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.deleteUser = factory.deleteOne(User);
