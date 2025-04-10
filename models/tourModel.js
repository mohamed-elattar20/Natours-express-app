const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true, // to not have two tours with the same name
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
          // this keyword only points to current doc on new doc creatio and won't work for update
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
      type: [String], // to define it's type as an array of strings
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
    // embedded document
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
    // an array of embedded documents
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
    //  Child Refrencing (tours is the parent and guides is the child)
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true }, //for each time data outputted as json make the virtuals appear
    toObject: { virtuals: true }, //for each time data outputted as object make the virtuals appear
  },
);

// to create an index on the price field and ratingsAverage field
// this is used to make the query faster when we search for the tours by price and ratingsAverage
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 for ascending and -1 for descending order
tourSchema.index({ slug: 1 });

///////// virtual property that won't be saved in DB but will be outputted to user with the data
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// ******* Virtual populate ******* //
// this is used to populate the data of the reviews in the tour data when we query for the tours
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
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

// ********* JUST FOR EXPERIMENT BEACUSE WE WILL USE DOCUMENT REFRENCING INSTEAD of embedded documents
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = await this.guides.map(
//     async (id) => await User.findById(id),
//   );

//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// ********* JUST FOR EXPERIMENT BEACUSE WE WILL USE DOCUMENT REFRENCING INSTEAD

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

// to get the data of the guides in the tour data when we query the tours
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

///////// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  // console.log(this.pipeline()); // points to the current aggregate Objcet
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
