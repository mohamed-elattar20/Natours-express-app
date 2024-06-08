const express = require('express');

const toursRouter = require('../controllers/tourController');

const router = express.Router();

router.route('/').get(toursRouter.getAllTours).post(toursRouter.createTour);
router
  .route('/:id')
  .get(toursRouter.getTourById)
  .patch(toursRouter.updateTour)
  .delete(toursRouter.deleteTour);

module.exports = router;
