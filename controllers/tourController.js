const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// Middleware to get the top 5 cheapest tours
exports.aliasTopToursMiddleware = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // 2. Excute the Query
  const features = new APIFeatures(
    /*query Object === this.query*/ Tour.find(),
    /*query string === this.queryString*/ req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // Send Response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

exports.getTourById = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews');
  if (!tour) {
    return next(new AppError(`No Tour Found With That ID`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: { tour },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // to make it return the new updated document
    runValidators: true, // it runs update validators which validates the update operation
  });

  if (!updatedTour) {
    return next(new AppError(`No Tour Found With That ID`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      updatedTour,
    },
  });
});

exports.deleteTour = factory.deleteOne(Tour);

// Aggregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // 1) first stage ( match stage )
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    // 2) second stage ( group stage )
    {
      $group: {
        // _id: null,
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    // 3) Third stage ( sort stage )
    { $sort: { avgPrice: 1 } },
    // { $match: { _id: { $ne: 'EASY' } } },  //We Can repeat the cycle of stages again
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTourStarts: -1 } },
    // { $limit: 12 },
  ]);
  res.status(200).json({
    status: 'success',
    data: { plan },
  });
});
