const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopToursMiddleware = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,summary,difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    // 2. Excute the Query
    const features = new APIFeatures(
      /*query Object*/ Tour.find(),
      /*query string*/ req.query,
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
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: error,
    });
  }
};
exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
      // message: 'error ( Invalid Data Sent )',
    });
  }
};
exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { tour },
    });
  } catch (error) {
    res.status(404).json({
      status: 'fail',
      message: 'err',
    });
  }
};
exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // to make it return the new updated document
      runValidators: true, // it runs update validators which validates the update operation
    });
    res.status(200).json({
      status: 'success',
      data: {
        updatedTour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
