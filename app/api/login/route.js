import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { login } from '@/lib/services/authService';

export async function POST(request) {
	try {
		await connectDB();
		const { email, password } = await request.json();
		const result = await login(email, password);
		return apiJson(result.body, result.status);
	} catch (err) {
		console.error('Login error:', err);
		return apiError('Server error', 500);
	}
}
