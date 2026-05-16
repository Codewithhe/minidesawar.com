import { isTargetCategory } from './category';
import { normalizeResultTime } from './resultPayload';

/**
 * Show every time slot for Minidesawer / Mini Desawar rows (no single-time filter).
 */
export function expandCategoryResults(items = []) {
	return items
		.filter((res) => isTargetCategory(res.categoryname))
		.map((res) => {
			const result = Array.isArray(res.result) ? res.result : [];
			const expandedResult = result
				.map((entry) => {
					if (Array.isArray(entry.times) && entry.times.length > 0) {
						return {
							...entry,
							date: entry.date || res.date,
							times: entry.times.map((t) => ({
								...t,
								time: normalizeResultTime(t.time) || t.time,
							})),
						};
					}

					if (entry.time != null && entry.number != null && entry.number !== '') {
						return {
							date: entry.date || res.date,
							times: [
								{
									time: normalizeResultTime(entry.time) || entry.time,
									number: entry.number,
								},
							],
						};
					}

					return null;
				})
				.filter(Boolean);

			if (expandedResult.length === 0 && res.number != null && res.number !== '') {
				const time =
					normalizeResultTime(res.time || res.next_result) || res.next_result || '—';
				expandedResult.push({
					date: res.date,
					times: [{ time, number: res.number }],
				});
			}

			return { ...res, result: expandedResult };
		})
		.filter((res) => res.result.length > 0);
}
