const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      // select: false,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!'],
    },
  },
  {
    toJSON: { virtuals: true }, //for each time data outputted as json make the virtuals appear
    toObject: { virtuals: true }, //for each time data outputted as object make the virtuals appear
  },
);

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo -_id',
  });
  // we won't need to populate the tour data in the review data because we will be getting the review data from the tour model when we query for a specific tour in the tour model
  // this.populate({
  //   path: 'user',
  //   select: 'name photo -_id',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
