const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (userId) =>
  jwt.sign(/*payload*/ { id: userId }, /*secret key*/ process.env.JWT_SECRET, {
    /*expire time of token*/
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    // passwordChangedAt: req.body.passwordChangedAt,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) check if email & password exist
  if (!email || !password) {
    return next(new AppError(`please provide email and password`, 400));
  }

  // 2) check if user exists & password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.isCorrectPassword(password, user.password)))
    return next(
      new AppError('Incorrect Email or password', 401 /*un Authorized*/),
    );

  // 3) if everything is ok, send token to client
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

// Protected route
exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(token);

  if (!token)
    return next(
      new AppError('You Are not logged in! Please log in to get access', 401),
    );

  // 2) Verfication token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decodedPayload);

  // 3) check if user still exists
  const currentUser = await User.findById(decoded.id);

  // console.log(currentUser);

  if (!currentUser)
    return next(
      new AppError('user belonging to this token does no lnoger exist.', 401),
    );
  // 4) Check if user changed password after the jwt token was issued

  if (currentUser.changedPasswordAfterTokenWasSent(decoded.iat)) {
    return next(
      new AppError('User recently Changed password! Please log in again', 401),
    );
  }

  // Grant Acces to the next middleware which is the getAllTours
  req.user = currentUser;
  next();
});

// eslint-disable-next-line arrow-body-style
exports.restrictTo = (...userRoles) => {
  return (req, res, next) => {
    if (!userRoles.includes(req.user.role /* from line 99 in the above*/)) {
      return next(
        new AppError(
          "you don't have permission to perform this action",
          403 /*means forbidden*/,
        ),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on POSTed Email
  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return next(new AppError("there's no user with email address.", 404));

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //  this line will deactivate all the validators on our schema
  await user.save({ validateBeforeSave: false });

  // 3) Send it to the users's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a patch request with your new password and confirm password to ${resetURL}.\n If you didn't forgot your password please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token is valid for only (10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
    });
  } catch (error) {
    console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError("there's an error in sending email.", 500));
  }
});
exports.resetPassword = (req, res, next) => {};
