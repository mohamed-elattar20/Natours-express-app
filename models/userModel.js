const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');

// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    // required means a "Required input" but not required to be saved in database
    required: [true, 'Please insert your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    validate: [validator.isEmail, 'Please provide a valid email'],
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 5,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (checkPassVal) {
        // this keyword only points to current doc on new doc creation
        // this only works on save (when we create a new object not when we update it)
        return checkPassVal === this.password;
      },
      message: 'you entered a wrong password',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
});

userSchema.pre('save', async function (next) {
  //  To only run if password is modified ( updated or created a new password )
  // isModified is a method for all documents and takes the field name as an argument
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // to not to save it in DB as we do only neec it for validation
  next();
});
userSchema.pre('save', function (next) {
  //  To only run if password is modified
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance methods : are methods that is gonna be available on all docs of the collection
// to check the password for the login functionality
userSchema.methods.isCorrectPassword = async function (
  // we are sending passwords as arguments as we set the select of password from DB to "false" so this.password here would'nt be available
  inputPassword, // req.body.password
  userPassword, // password from DB
) {
  return await bcrypt.compare(inputPassword, userPassword); // returns true or false
};
// to create a reset password random token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

//  to check if the password has been changed after the token was issued
userSchema.methods.changedPasswordAfterTokenWasSent = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    // console.log(changedTimestamp, jwtTimestamp);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// Query Middleware for not getting a user with the active property set to false
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
