const express = require('express');

const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({
  // this will allow us to use the tourId param in the review routes as well which is passed in the url in tourRoutes
  mergeParams: true,
});

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourAndUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
