import { verifyAuthToken } from '../auth';
import { apiError } from './response';

export async function withAuth(request, handler) {
	const authHeader = request.headers.get('authorization');

	if (!authHeader) {
		return apiError('Auth code required', 401);
	}

	const token = authHeader.split(' ')[1];
	if (!token) {
		return apiError('Invalid auth code', 401);
	}

	try {
		const payload = verifyAuthToken(token);
		return handler(payload);
	} catch {
		return apiError('Invalid or expired auth code', 403);
	}
}
