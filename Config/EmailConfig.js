const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this to 'outlook', 'hotmail', etc.
    auth: {
        user: process.env.EMAIL_USER,    // Your business email
        pass: process.env.EMAIL_PASS     // Your App Password (not your regular password)
    }
});

module.exports = transporter;
