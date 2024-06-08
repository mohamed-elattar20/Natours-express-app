exports.getAllTours = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      results: 10,
      data: 'tours',
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
exports.createTour = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      results: 10,
      data: 'tours',
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
exports.getTourById = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      results: 10,
      data: 'tours',
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
exports.updateTour = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      results: 10,
      data: 'tours',
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
exports.deleteTour = (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      results: 10,
      data: 'tours',
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'err',
    });
  }
};
