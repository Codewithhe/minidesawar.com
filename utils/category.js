/** Canonical name sent to POST /api/result — must match MongoDB categoryname. */
export const DEFAULT_CATEGORY_NAME = 'Minidesawer';

const ALIASES = new Set(['minidesawer', 'minidesawar', 'minisdesawar', 'minidesawr']);

export function normalizeCategoryName(value) {
	return String(value ?? '')
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, '');
}

export function isTargetCategory(categoryname) {
	const n = normalizeCategoryName(categoryname);
	if (!n) return false;
	return ALIASES.has(n) || n === normalizeCategoryName(DEFAULT_CATEGORY_NAME);
}
