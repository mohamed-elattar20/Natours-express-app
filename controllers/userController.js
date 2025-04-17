const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// this function will create a unique name for the file and save it in the public/img/users folder
// const multerStorage = multer.diskStorage({
//   destination: (
//     req,
//     currentUploadedFile,
//     callBackFunc /* similar to next in express*/,
//   ) => {
//     callBackFunc(null /* is error if there is */, 'public/img/users'); // this is the path where the file will be saved
//   },
//   filename: (req, file, callBackFunc) => {
//     // this will create a unique name for the file by using the current time and the original file name
//     const ext = file.mimetype.split('/')[1]; // to get the file extension
//     callBackFunc(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage(); // this will store the file in memory as a buffer

// this function's goal is to test if the file is an image or not
const multerFilter = (req, file, callBackFunc) => {
  // check if the file is an image or not
  if (file.mimetype.startsWith('image')) {
    callBackFunc(null, true); // passing true will allow the file to be saved
  } else {
    callBackFunc(
      new AppError('Not an image! Please upload only images', 400),
      false,
    ); // passing an error and false will not allow the file to be saved
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  // limits: { fileSize: 1000000 },
});

// the file will be available in req.file
// single file upload with the name 'photo' which is the field name in DB
exports.uploadUserPhoto = upload.single('photo'); // this will create a file object in the req.file

exports.resizeUserPhoto = (req, res, next) => {
  // if there is no file in the request, we don't need to resize it
  if (!req.file) return next(); // this will skip the middleware

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; // this will create a unique name for the file by using the current time and the original file name

  // this will convert the image to a buffer and resize it to 500x500 and save it in the public/img/users folder and configure
  // the quality to 90% and the format to jpeg
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}.jpeg`); // this will save the file in the public/img/users folder

  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = factory.getAll(User);

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
exports.getUserById = factory.getOne(User);

// For the user himsel to update just specfic parts of his data (name , email)
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file); // this will log the file object that was uploaded

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
  if (req.file) filteredBody.photo = req.file.filename; // this will save the file name in the DB

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

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; // to get the current user id from the token from the protect middleware
  next();
};

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
