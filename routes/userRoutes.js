const express = require('express');

const usersRouter = require('../controllers/userController');

const router = express.Router();

router.route('/').get(usersRouter.getAllUsers).post(usersRouter.createUser);
router
  .route('/:id')
  .get(usersRouter.getUserById)
  .patch(usersRouter.updateUser)
  .delete(usersRouter.deleteUser);

module.exports = router;
