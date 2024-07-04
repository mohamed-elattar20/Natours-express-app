const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// For Admin to update all the user's date
exports.updateUser = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: 'Users',
  });
});

exports.deleteUser = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      results: 10,
      data: 'tours',
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
