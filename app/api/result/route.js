import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { withAuth } from '@/lib/api/withAuth';
import { createNewResult } from '@/lib/services/resultService';

export async function POST(request) {
	try {
		await connectDB();
		return withAuth(request, async () => {
			const body = await request.json();
			const result = await createNewResult(body);
			return apiJson(result.body, result.status);
		});
	} catch (err) {
		console.error('POST /result error:', err);
		return apiError('Server error', 500, { error: err.message });
	}
}
