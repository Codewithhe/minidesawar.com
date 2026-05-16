import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

export async function sendOtpEmail(email, otp) {
	if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
		console.warn('[mailer] EMAIL_USER / EMAIL_PASS not set — skipping OTP email');
		return null;
	}

	return transporter.sendMail({
		from: process.env.EMAIL_USER,
		to: email,
		subject: 'Your OTP Code',
		text: `Your OTP for password reset is: ${otp}`,
	});
}
