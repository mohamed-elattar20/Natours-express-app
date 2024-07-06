const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      default: 'mohamed khaled',
      unique: true,
      trim: true, // only works For a string
      maxLength: [40, 'A tour must have less than or equal to 40 character'],
      minLength: [10, 'A tour must have more than or equal to 10 character'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscout: {
      type: Number,
      validate: {
        validator: function (priceDiscountVal) {
          // this keyword only points to current doc on new doc creation
          return priceDiscountVal < this.price;
        },
        message: 'Discount price ({VALUE}) must be less than regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      // required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: {
      type: [String],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // to not to send it back with the response as i want the user not to see it
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //  GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
  },
  {
    toJSON: { virtuals: true }, //for each time data outputted as json make the virtuals appear
    toObject: { virtuals: true }, //for each time data outputted as object make the virtuals appear
  },
);

///////// virtual property that won't be saved in DB but will be outputted to user with the data
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

///////// DOCUMENT MIDDLEWARE : runs before .save() , .create() but not .insertMany()
tourSchema.pre('save', function (next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});
/////// if we don't use "this variable" then we use arrow function as per prettier
// tourSchema.pre('save', (next) => {
//   console.log(`will save doc ...`);
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

///////// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  // console.log(this); // will refer to the currently processed query
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
// tourSchema.post(/^find/, function (docs, next) {
//   // console.log(`Query Took ${Date.now() - this.start} milliseconds`);
//   // console.log(docs);
//   next();
// });

///////// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // console.log(this.pipeline()); // points to the current aggregate Objcet
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
