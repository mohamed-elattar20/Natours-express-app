// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter

  const transporter = nodemailer.createTransport({
    // For Gmail **************
    // service: 'Gmail',
    // auth: {
    //   user: process.env.EMAIL_USERNAME,
    //   pass: process.env.EMAIL_PASSWORD,
    // },
    // Activate in gmail "less secure app" option
    // **************
    // For mailtrap
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });
  // 2) Define the email options
  const mailOptions = {
    from: 'mohamed el attar <mohamedelattarm819@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html :
  };
  // 3) Send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
