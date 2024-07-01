const mongoose = require('mongoose');
const validator = require('validator');

// eslint-disable-next-line import/no-extraneous-dependencies
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
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
    minLength: 8,
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
  photo: String,
  // passwordChangedAt: Date,
});

userSchema.pre('save', async function (next) {
  //  To only run if password is modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // to not to save it in DB as we do only neec it for validation
  next();
});
// Instance methods : are methods that is gonna be available on all docs of the collection
userSchema.methods.isCorrectPassword = async function (
  inputPassword,
  userPassword,
) {
  return await bcrypt.compare(inputPassword, userPassword); // returns true or false
};

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

const User = mongoose.model('User', userSchema);

module.exports = User;
