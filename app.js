/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorhandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

app.enable('trust proxy'); // for rate limiting to work on heroku

// Global middlewares

// Set Security Http Headers
app.use(helmet());

//  Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// this will allow 100 request for each user in time sapn of 1 hour
const limiter = rateLimit({
  max: 100, // 100 request per user ( IP )
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, Please try again in 1 hour!',
});

app.use('/api', limiter);

//  Body parser , reading data from body into req.body
app.use(
  express.json({
    // will limit the body the user sends to be less than 10kb
    limit: '10kb',
  }),
);
app.use(cookieParser()); // for parsing cookies

// Data Sanitization against NoSQL query Injection
app.use(mongoSanitize());

// Data Sanitization against XSS (cross-site scripting attacks)
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'ratingsQuantity',
      'sort',
      'duration',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Serving Static files
app.use(express.static(`${__dirname}/public`));

app.use(compression()); // Compressing the response to make it smaller

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

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
