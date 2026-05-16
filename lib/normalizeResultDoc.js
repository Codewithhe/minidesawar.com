import moment from 'moment';

export function safeFormatTime(rawTime) {
	if (rawTime == null || rawTime === '') return null;
	const m = moment(String(rawTime).trim(), [
		'HH:mm',
		'hh:mm A',
		'h:mm A',
		'hh:mma',
		'h:mma',
		moment.ISO_8601,
	], true);
	return m.isValid() ? m.format('hh:mm A') : null;
}

function normalizeResultEntries(doc) {
	const rootDate = doc?.date
		? moment(doc.date, ['YYYY-MM-DD', 'DD/MM/YY'], true).format('YYYY-MM-DD')
		: null;
	const rawResult = Array.isArray(doc?.result) ? doc.result : [];
	const normalized = [];

	for (const entry of rawResult) {
		if (!entry || typeof entry !== 'object') continue;

		const entryDate = entry.date
			? moment(entry.date, ['YYYY-MM-DD', 'DD/MM/YY'], true).format('YYYY-MM-DD')
			: rootDate;

		if (!entryDate || entryDate === 'Invalid date') continue;

		if (Array.isArray(entry.times) && entry.times.length > 0) {
			const times = entry.times
				.map((t) => {
					const time = safeFormatTime(t?.time);
					if (!time) return null;
					const number = t?.number ?? t?.result ?? doc?.number;
					if (number === undefined || number === null) return null;
					return { time, number };
				})
				.filter(Boolean);

			if (times.length) normalized.push({ date: entryDate, times });
			continue;
		}

		const time = safeFormatTime(entry.time);
		if (time) {
			const number = entry.number ?? entry.result ?? doc?.number;
			if (number !== undefined && number !== null) {
				normalized.push({
					date: entryDate,
					times: [{ time, number }],
				});
			}
		}
	}

	if (normalized.length === 0 && rootDate && doc?.number != null && doc?.number !== '') {
		const time =
			safeFormatTime(doc.time) ||
			safeFormatTime(doc.next_result) ||
			safeFormatTime(doc.next_time);
		if (time) {
			normalized.push({
				date: rootDate,
				times: [{ time, number: doc.number }],
			});
		}
	}

	return normalized;
}

export function normalizeResultDocument(doc) {
	const plain = doc?.toObject ? doc.toObject() : { ...doc };
	plain.result = normalizeResultEntries(plain);
	if (!plain.date && plain.result[0]?.date) {
		plain.date = plain.result[0].date;
	}
	return plain;
}

function isCurrentMonthDate(dateStr, currentMonth, currentYear) {
	const entryDate = moment(dateStr, 'YYYY-MM-DD', true);
	if (!entryDate.isValid()) return false;
	return entryDate.month() === currentMonth && entryDate.year() === currentYear;
}

function filterTimesForToday(times, entryDate, today) {
	if (entryDate !== today || !Array.isArray(times)) return times;

	const now = moment();
	return times.filter((t) => {
		const slot = moment(t.time, 'hh:mm A', true);
		if (!slot.isValid()) return true;
		const slotToday = moment()
			.hour(slot.hour())
			.minute(slot.minute())
			.second(0)
			.millisecond(0);
		return slotToday.isSameOrBefore(now);
	});
}

export function buildMonthResultsPayload(docs, { applyTimeGate = true } = {}) {
	const currentTime = moment();
	const today = currentTime.format('YYYY-MM-DD');
	const currentMonth = currentTime.month();
	const currentYear = currentTime.year();

	return docs
		.map((doc) => normalizeResultDocument(doc))
		.map((doc) => {
			const filteredResult = doc.result
				.filter((entry) => isCurrentMonthDate(entry.date, currentMonth, currentYear))
				.map((entry) => {
					let times = [...(entry.times || [])];
					if (applyTimeGate) {
						times = filterTimesForToday(times, entry.date, today);
					}
					times.sort((a, b) =>
						moment(a.time, 'hh:mm A').diff(moment(b.time, 'hh:mm A'))
					);
					return { ...entry, times };
				})
				.filter((entry) => entry.times.length > 0);

			return { ...doc, result: filteredResult };
		})
		.filter((doc) => doc.result.length > 0);
}

export async function repairStoredResultShape(doc, ResultsModel) {
	if (!doc?._id || !ResultsModel) return normalizeResultDocument(doc);

	const normalized = normalizeResultDocument(doc);
	const before = JSON.stringify(doc.result || []);
	const after = JSON.stringify(normalized.result || []);

	if (before === after) return normalized;

	await ResultsModel.updateOne(
		{ _id: doc._id },
		{
			$set: {
				result: normalized.result,
				...(normalized.date ? { date: normalized.date } : {}),
			},
		}
	);

	return normalized;
}

export function isMiniDesawarCategory(categoryname) {
	if (!categoryname) return false;
	const compact = String(categoryname).trim().toLowerCase().replace(/[\s_-]+/g, '');
	return (
		compact === 'minidesawer' ||
		compact === 'minidesawar' ||
		compact === 'minisdesawar' ||
		compact === 'minidesawr'
	);
}
