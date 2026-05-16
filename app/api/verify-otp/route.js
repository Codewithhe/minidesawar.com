import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { verifyOtp } from '@/lib/services/authService';

export async function POST(request) {
	try {
		await connectDB();
		const { email, otp } = await request.json();
		const result = await verifyOtp(email, otp);
		return apiJson(result.body, result.status);
	} catch (err) {
		console.error('Verify OTP error:', err);
		return apiError('Server error', 500);
	}
}
