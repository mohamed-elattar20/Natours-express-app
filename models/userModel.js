const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please insert your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    validator: [validator.isEmail, 'Please provide a valid email'],
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
      validator: function (val) {
        // this keyword only points to current doc on new doc creation
        return val === this.password;
      },
      message: 'you entered a wrong password',
    },
  },
  photo: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
