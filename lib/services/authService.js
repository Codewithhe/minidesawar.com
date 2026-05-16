import User from '../models/User';
import { generateAuthCode } from '../auth';
import { sendOtpEmail } from '../mailer';

export async function login(email, password) {
	const user = await User.findOne({ email });
	if (!user) {
		return { status: 401, body: { message: 'Invalid email or password' } };
	}

	const isMatch = await user.matchPassword(password);
	if (!isMatch) {
		return { status: 401, body: { message: 'Invalid email or password' } };
	}

	const token = generateAuthCode(user.id);
	return {
		status: 200,
		body: { message: 'Login successful', authCode: token },
	};
}

export async function generateOtp(email) {
	const user = await User.findOne({ email });
	if (!user) {
		return { status: 404, body: { message: 'No user with that email' } };
	}

	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const expiry = new Date(Date.now() + 10 * 60 * 1000);

	user.otp = otp;
	user.otpExpiry = expiry;
	user.authenticated = false;
	await user.save();

	try {
		await sendOtpEmail(email, otp);
	} catch (e) {
		console.error('[mailer] generateOtp:', e.message);
	}

	return { status: 200, body: { message: 'OTP generated successfully' } };
}

export async function verifyOtp(email, otp) {
	const user = await User.findOne({ email, otp });
	if (!user) {
		return { status: 404, body: { message: 'User not found or wrong OTP' } };
	}

	if (!user.otpExpiry || user.otpExpiry < Date.now()) {
		return { status: 400, body: { message: 'OTP has expired' } };
	}

	user.authenticated = true;
	user.otp = null;
	user.otpExpiry = null;
	await user.save();

	return {
		status: 200,
		body: { message: 'OTP verified successfully. Account activated.' },
	};
}

export async function resetPassword(email, _oldPassword, newPassword) {
	const user = await User.findOne({ email });
	if (!user) {
		return { status: 401, body: { message: 'Invalid email' } };
	}

	user.password = newPassword;
	await user.save();

	const token = generateAuthCode(user.id);
	return {
		status: 200,
		body: { message: 'Password reset successful', authCode: token },
	};
}
