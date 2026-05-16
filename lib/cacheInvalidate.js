import moment from 'moment';
import redis from './redis';

export function monthAggregateKey(isoDateStr) {
	const d = moment(isoDateStr, 'YYYY-MM-DD', true);
	if (!d.isValid()) return null;
	return `results:${d.year()}-${d.month()}`;
}

async function invalidateMonthResultsCache(isoDateStr) {
	const key = monthAggregateKey(isoDateStr);
	if (!key) return;
	try {
		await redis.del(key);
	} catch (e) {
		console.error('[redis] invalidateMonthResultsCache:', e.message);
	}
}

async function invalidateDateViewCaches(categoryname, isoDateStr) {
	if (!categoryname || !isoDateStr) return;
	for (const mode of ['scraper', 'manual', 'auto']) {
		try {
			await redis.del(`results:date:${categoryname}:${isoDateStr}:${mode}`);
		} catch (e) {
			console.error('[redis] invalidateDateViewCaches:', e.message);
		}
	}
}

async function invalidateResultsByMonthCache(categoryname, isoDateStr) {
	if (!categoryname || !isoDateStr) return;
	for (const mode of ['scraper', 'manual', 'auto']) {
		try {
			await redis.del(`resultsByMonth:${categoryname}:${isoDateStr}:${mode}`);
		} catch (e) {
			console.error('[redis] invalidateResultsByMonthCache:', e.message);
		}
	}
}

export async function invalidateAfterResultWrite(categoryname, isoDateStr) {
	await invalidateMonthResultsCache(isoDateStr);
	await invalidateDateViewCaches(categoryname, isoDateStr);
	await invalidateResultsByMonthCache(categoryname, isoDateStr);
}

export async function invalidateResultCaches(categoryname, isoDateStr) {
	await invalidateAfterResultWrite(categoryname, isoDateStr);
	try {
		await redis.del(`results:${categoryname}:${isoDateStr}`);
		await redis.del('results:all');
		await redis.del('categories:all');
	} catch (e) {
		console.error('[redis] invalidateResultCaches:', e.message);
	}
}
