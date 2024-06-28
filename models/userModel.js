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
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
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
});

userSchema.pre('save', async function (next) {
  //  To only run if password is modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
