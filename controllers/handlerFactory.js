const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// A handler factory function that handles the delete operation any model
// it takes in the model as a parameter and returns a function that handles the delete operation for that model
// this is to avoid code duplication in the rest of the controllers
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No document Found With That ID`, 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // to make it return the new updated document
      runValidators: true, // it runs update validators which validates the update operation
    });

    if (!updatedDoc) {
      return next(new AppError(`No document Found With That ID`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: updatedDoc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query; // Model.findById(req.params.id).populate('reviews');

    if (!doc) {
      return next(new AppError(`No document Found With That ID`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: { data: doc },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to get all reviews for a specific tour if there's a tourId in the req url
    // To Allow for nested Get reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // 2. Excute the Query
    const features = new APIFeatures(
      /*query Object === this.query*/ Model.find(filter),
      /*query string === this.queryString*/ req.query,
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    // Send Response
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: { data: doc },
    });
  });
