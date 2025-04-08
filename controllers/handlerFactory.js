const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
