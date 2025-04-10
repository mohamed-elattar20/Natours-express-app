const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

// will only recieve the email address
router.post('/forgotPassword', authController.forgotPassword);
// will recieve the token in addition to the new password
router.patch('/resetPassword/:token', authController.resetPassword);

// this will protect all the routes after this line
// so we don't need to repeat the same code in each route
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUserById);
router.patch('/updateMe', userController.getMe, userController.getUserById);
// actually we are not deleting the user we just set the active property to false
// so if the user needed to active his account again
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
