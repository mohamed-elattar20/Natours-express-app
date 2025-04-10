const mongoose = require('mongoose');
const Tour = require('./tourModel');

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

// static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //  this here refers to the model itself, not the document
  const stats = await this.aggregate([
    {
      $mathch: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// after a review is created, we want to calculate the average rating for the tour
// post middleware does not get the next function as a parameter
reviewSchema.post('save', function () {
  // this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

// findByIdAndUpdate and findByIdAndDelete are not using the post middleware because they are not using the save method
// so we have to use the pre middleware for these methods
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this points to current query
  this.rev = await this.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function (doc) {
  // await this.findOne(); // doesn't work here, query has already executed ( as we are using post middleware )
  // this points to current query
  await this.rev.constructor.calcAverageRatings(this.rev.tour);
});
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
