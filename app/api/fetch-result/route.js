import { connectDB } from '@/lib/db';
import { apiError, apiJson } from '@/lib/api/response';
import { withAuth } from '@/lib/api/withAuth';
import { fetchAllResults } from '@/lib/services/resultService';

export async function GET(request) {
	try {
		await connectDB();
		return withAuth(request, async () => {
			const result = await fetchAllResults();
			return apiJson(result.body, result.status);
		});
	} catch (err) {
		console.error('GET /fetch-result error:', err);
		return apiError('Error fetching results', 500, { error: err.message });
	}
}
