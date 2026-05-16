import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { generateOtp } from '@/lib/services/authService';

export async function POST(request) {
	try {
		await connectDB();
		const { email } = await request.json();
		const result = await generateOtp(email);
		return apiJson(result.body, result.status);
	} catch (err) {
		console.error('Generate OTP error:', err);
		return apiError('Server error', 500);
	}
}
