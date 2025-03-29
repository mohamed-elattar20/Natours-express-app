const fs = require('fs');

const mongoose = require('mongoose');

const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config();

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

//  CONNECTING TO HOSTED DATABASE ON MONGODB ATLAS
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((connectionObj) => console.log(`Db Connection is Successfull`))
  .catch((err) => console.log(err));

//   Read Json File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

// Import Data into Database
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log(`Data Successfully Downloaded`);
    process.exit();
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// Delete All Data From Collection
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log(`Data Successfully Deleted`);
    process.exit();
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
// to run these scripts node dev-data/data/import-dev-data.js -- import || --delete
// console.log(process.argv);
