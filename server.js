const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const result = dotenv.config({});
// const result = dotenv.config({ path: './config.env' });

const app = require('./app');

// console.log(result.parsed);
// console.log(process.env.NODE_ENV);

const DB = process.env.DATABASE.replace(
  '<password>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {   // Local database Connection
  .connect(DB, {
    // mongoDB Atlas Hosted database Connection
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then((/*connectionObj*/) => {
    console.log(`Db Connection is Successfull`);
    // console.log(connectionObj);
  })
  .catch((err) => {
    console.log(err);
  });

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`App is Running on port ${PORT}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, 'hello error', err.message);
  console.log('Unhandled Rejection 🤬 Shutting Down...');
  server.close(() => {
    process.exit(1);
  });
});
