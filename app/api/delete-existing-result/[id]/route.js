import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { withAuth } from '@/lib/api/withAuth';
import { deleteTimeEntry } from '@/lib/services/resultService';

export async function PATCH(request, { params }) {
	try {
		await connectDB();
		const { id } = await params;
		return withAuth(request, async () => {
			const body = await request.json();
			const result = await deleteTimeEntry(id, body);
			return apiJson(result.body, result.status);
		});
	} catch (err) {
		console.error('PATCH /delete-existing-result error:', err);
		return apiError('Error deleting time entry', 500);
	}
}
