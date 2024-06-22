const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorhandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/pubilc`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Handling unknow routes (Error handling)
app.all('*', (req, res, next) => {
  //
  // const err = new Error(`Can't Find ${req.originalUrl} on this server`);
  // err.status = 'failed';
  // err.statusCode = 404;
  // next(err)

  next(new AppError(`Can't Find ${req.originalUrl} on this server`, 404));
});

//  Global Error Handling for app
app.use(globalErrorhandler);

module.exports = app;
