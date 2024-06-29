const User = require('../models/userModel');
// const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
exports.updateUser = (req, res) => {
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
