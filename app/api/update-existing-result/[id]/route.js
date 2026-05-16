import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { withAuth } from '@/lib/api/withAuth';
import { updateResult } from '@/lib/services/resultService';

export async function PUT(request, { params }) {
	try {
		await connectDB();
		const { id } = await params;
		return withAuth(request, async () => {
			const body = await request.json();
			const result = await updateResult(id, body);
			return apiJson(result.body, result.status);
		});
	} catch (err) {
		console.error('PUT /update-existing-result error:', err);
		return apiError('Internal Server Error', 500, { error: err.message });
	}
}
