const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Booking = require('../models/bookingModel');
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //  1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // line_items: [
    //   {
    //     name: `${tour.name} Tour`,
    //     description: tour.summary,
    //     images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
    //     // images: [
    //     //   `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
    //     // ],
    //     amount: tour.price * 100,
    //     currency: 'usd',
    //     quantity: 1,
    //   },
    // ],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            // images: [
            //     //   `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
            //     // ],
          },
          unit_amount: tour.price * 100, // amount in smallest currency unit (cents)
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });
  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is temporary, because it's unsecure: anyone can make bookings without paying
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

// Middleware to check if the user has booked the tour
exports.restrictToBookedUsers = catchAsync(async (req, res, next) => {
  const { tourId } = req.params;
  const userId = req.user.id;

  // Check if the user has a booking for the specified tour
  const booking = await Booking.findOne({ tour: tourId, user: userId });

  if (!booking) {
    return next(
      new AppError('You can only review tours you have booked.', 403),
    );
  }

  next();
});

exports.setToursAndUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; // logged in user

  next();
};

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
