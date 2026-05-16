import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { withAuth } from '@/lib/api/withAuth';
import { getResultById } from '@/lib/services/resultService';

export async function GET(request, { params }) {
	try {
		await connectDB();
		const { id } = await params;
		return withAuth(request, async () => {
			const result = await getResultById(id);
			return apiJson(result.body, result.status);
		});
	} catch (err) {
		console.error('GET /result/:id error:', err);
		return apiError('Server error', 500);
	}
}
