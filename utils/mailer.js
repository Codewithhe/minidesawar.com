require('dotenv').config();
const nodemailer = require('nodemailer');

// Setup SMTP transporter (Gmail example)
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER, // Get email from .env file
		pass: process.env.EMAIL_PASS, // Get password from .env file
	},
	port: 567,
});

// Send OTP email
const sendOtpEmail = (email, otp) => {
	console.log('email::', email);

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: 'Your OTP Code',
		text: `Your OTP for registration is: ${otp}`,
	};

	return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
