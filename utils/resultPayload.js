import moment from 'moment';

/**
 * Normalize GET /fetch-result JSON body to a document array (handles common API shapes).
 */
export const extractResultsPayload = (body) => {
	if (Array.isArray(body)) return body;
	if (Array.isArray(body?.data)) return body.data;
	if (Array.isArray(body?.results)) return body.results;
	if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
		const inner = body.data.data ?? body.data.results;
		if (Array.isArray(inner)) return inner;
	}
	return [];
};

/** Normalize any stored time (ISO, 24h, AM/PM) to `hh:mm A` for comparisons and UI. */
export const normalizeResultTime = (time) => {
	if (time == null || time === '') return '';
	const s = String(time).trim();
	const strict = moment(s, [
		'hh:mm A',
		'h:mm A',
		'hh:mm a',
		'h:mm a',
		'HH:mm',
		moment.ISO_8601,
	], true);
	if (strict.isValid()) return strict.format('hh:mm A');
	const loose = moment(s);
	return loose.isValid() ? loose.format('hh:mm A') : '';
};
