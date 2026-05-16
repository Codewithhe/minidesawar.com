import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { resetPassword } from '@/lib/services/authService';

export async function POST(request) {
	try {
		await connectDB();
		const { email, oldPassword, newPassword } = await request.json();
		const result = await resetPassword(email, oldPassword, newPassword);
		return apiJson(result.body, result.status);
	} catch (err) {
		console.error('Reset password error:', err);
		return apiError('Server error', 500);
	}
}
