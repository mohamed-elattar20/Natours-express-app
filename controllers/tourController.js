const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage(); // this will store the file in memory as a buffer

// this function's goal is to test if the file is an image or not
const multerFilter = (req, file, callBackFunc) => {
  // check if the file is an image or not
  if (file.mimetype.startsWith('image')) {
    callBackFunc(null, true); // passing true will allow the file to be saved
  } else {
    callBackFunc(
      new AppError('Not an image! Please upload only images', 400),
      false,
    ); // passing an error and false will not allow the file to be saved
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // if there is no file in the request, we don't need to resize it
  if (!req.files.imageCover || !req.files.images) return next(); // this will skip the middleware

  // 1) cover image
  // this will create a unique name for the file by using the current time and the original file name
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) images
  req.body.images = [];

  // this will convert the image to a buffer and resize it to 500x500 and save it in the public/img/users folder and configure
  // the quality to 90% and the format to jpeg
  // we used the map function to loop over the images and return an array of promises as if we used forEach it will not return an array of promises and then the next function will not wait for the promises to be resolved
  // so we used Promise.all to wait for all the promises to be resolved before moving to the next function
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  next();
});

// the file will be available in req.file
// single file upload with the name 'photo' which is the field name in DB
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// Middleware to get the top 5 cheapest tours
exports.aliasTopToursMiddleware = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.createTour = factory.createOne(Tour);

exports.getTourById = factory.getOne(Tour, { path: 'reviews' });

exports.updateTour = factory.updateOne(Tour);

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

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  // console.log(lat, lng);
  // console.log(distance, latlng, unit);

  // Earth radius in miles or kilometers
  const multiplier = unit === 'mi' ? 3963.2 : 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitute and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: {
      // this to get the nearest tours to the given start location
      $geoWithin: { $centerSphere: [[lng, lat], distance / multiplier] },
    },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

// geospatial aggregation query to get the distance between the given lat and lng and the tours in the database
// this is a better way to do it as we don't need to repeat the same code in the getToursWithin function
// and we can use this function to get the distance between any two points in the world
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // meters to miles or kilometers

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitute and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      // needs at least 1 geo index to work but if we have more than 1 we will have to specify the one we want to use with key property
      // $geoNear: { key: 'startLocation', spherical: true },
      $geoNear: {
        // near is the point we want to get the distance from
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        // this is the field name that will be used to store the distance
        distanceField: 'distance',
        distanceMultiplier: multiplier, // this is the multiplier to convert the distance to miles or kilometers
      },
    },
    // The $project stage is used to specify which fields to include or exclude in the output documents.
    // In this case, we are including the distance field (rounded to 2 decimal places) and the name field.
    {
      $project: {
        distance: { $round: ['$distance', 2] },
        name: 1, // 1 means include this field in the output document , 0 means exclude this field from the output document
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: { data: distances },
  });
});
