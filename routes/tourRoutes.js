const express = require('express');

const tourController = require('../controllers/tourController');

const router = express.Router();

// Middleware for the id param to check it we don't need it at id as the database will do this
// but we will need it for any other param might be sent in request
// router.param('id', tourController.checkId);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
router
  .route('/:id')
  .get(tourController.getTourById)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
