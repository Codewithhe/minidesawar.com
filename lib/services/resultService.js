import mongoose from 'mongoose';
import moment from 'moment';
import Result from '../models/Result';
import CategoryKey from '../models/CategoryKey';
import redis from '../redis';
import { invalidateAfterResultWrite, invalidateResultCaches } from '../cacheInvalidate';
import {
	safeFormatTime,
	normalizeResultDocument,
	repairStoredResultShape,
	isMiniDesawarCategory,
} from '../normalizeResultDoc';

export async function createNewResult(body) {
	const {
		categoryname,
		date,
		number,
		next_result,
		next_time,
		key,
		time,
		mode,
	} = body;

	const formattedDate = moment(date, ['DD/MM/YY', 'YYYY-MM-DD'], true).format('YYYY-MM-DD');
	const formattedTime = safeFormatTime(time);
	const formattedNextTime = safeFormatTime(next_time);

	if (!formattedTime) {
		return { status: 400, body: { message: 'Invalid or missing time format' } };
	}

	const timesToAdd = [];
	timesToAdd.push({ time: formattedTime, number });
	if (formattedNextTime && next_result) {
		timesToAdd.push({ time: formattedNextTime, number: next_result });
	}

	let doc = await Result.findOne({ categoryname });

	if (doc) {
		const dateGroup = doc.result.find((r) => r.date === formattedDate);

		if (dateGroup) {
			const duplicateTimes = timesToAdd
				.filter((t) => dateGroup.times.some((existing) => existing.time === t.time))
				.map((t) => t.time);

			if (duplicateTimes.length > 0) {
				return { status: 200, body: { message: 'Duplicate time(s) detected' } };
			}

			await Result.updateOne(
				{ categoryname, 'result.date': formattedDate },
				{
					$push: { 'result.$.times': { $each: timesToAdd } },
					$set: { next_result },
				}
			);
		} else {
			await Result.updateOne(
				{ categoryname },
				{
					$push: { result: { date: formattedDate, times: timesToAdd } },
					$set: { next_result },
				}
			);
		}

		doc = await Result.findOne({ categoryname });
	} else {
		doc = await Result.create({
			categoryname,
			key,
			mode,
			number: Number(number) || 0,
			next_result,
			result: [{ date: formattedDate, times: timesToAdd }],
			date,
		});
	}

	const cacheKey = `results:${categoryname}:${formattedDate}`;
	try {
		const normalizedDoc = normalizeResultDocument(doc);
		await redis.set(cacheKey, JSON.stringify(normalizedDoc), { ex: 50 });
		await invalidateAfterResultWrite(categoryname, formattedDate);
	} catch (redisErr) {
		console.error('[redis] createNewResult:', redisErr.message);
	}

	return {
		status: 200,
		body: { message: 'Result saved successfully', data: doc },
	};
}

export async function fetchAllResults() {
	const latestResult = await Result.find({}).sort({ createdAt: -1 }).lean();

	const miniDesawarDocs = latestResult.filter((doc) =>
		isMiniDesawarCategory(doc.categoryname)
	);

	await Promise.allSettled(
		miniDesawarDocs.map((doc) => repairStoredResultShape(doc, Result))
	);

	const data = miniDesawarDocs
		.map((doc) => normalizeResultDocument(doc))
		.map((doc) => {
			doc.result.forEach((entry) => {
				if (Array.isArray(entry.times)) {
					entry.times.sort((a, b) =>
						moment(b.time, 'hh:mm A').diff(moment(a.time, 'hh:mm A'))
					);
				}
			});
			return doc;
		})
		.filter((doc) => doc.result.length > 0);

	return {
		status: 200,
		body: { message: 'Results fetched successfully', data },
	};
}

export async function updateResult(id, body) {
	const { date, time, number, next_result } = body;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return { status: 400, body: { message: 'Invalid id' } };
	}

	const collection = mongoose.connection.db.collection('results');
	const updated = await collection.updateOne(
		{ _id: new mongoose.Types.ObjectId(id) },
		{
			$set: {
				'result.$[d].times.$[t].number': number,
				next_result,
			},
		},
		{
			arrayFilters: [{ 'd.date': date }, { 't.time': time }],
		}
	);

	if (updated.matchedCount === 0) {
		return { status: 200, body: { message: 'No matching date/time entry found' } };
	}

	const doc = await Result.findById(id).lean();
	if (doc?.categoryname && doc?.date) {
		await invalidateResultCaches(doc.categoryname, date);
	}

	return {
		status: 200,
		body: { message: 'Result updated successfully', data: updated },
	};
}

export async function getResultById(id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return {
			status: 400,
			body: { baseResponse: { message: 'INVALID_ID', status: 0 }, response: [] },
		};
	}

	const cacheKey = `result:id:${id}`;
	try {
		const cached = await redis.get(cacheKey);
		if (cached) {
			const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
			return { status: 200, body: parsed };
		}
	} catch (e) {
		console.error('[redis] getResultById:', e.message);
	}

	const result = await Result.findById(id);
	if (!result) {
		return {
			status: 404,
			body: { baseResponse: { message: 'NOT_FOUND', status: 0 }, response: [] },
		};
	}

	const response = {
		baseResponse: { message: 'STATUS_OK', status: 1 },
		response: result,
	};

	try {
		await redis.set(cacheKey, JSON.stringify(response), { ex: 50 });
	} catch (e) {
		console.error('[redis] getResultById set:', e.message);
	}

	return { status: 200, body: response };
}

export async function deleteTimeEntry(id, body) {
	const { date, time } = body;

	const updated = await Result.findOneAndUpdate(
		{ _id: id },
		{ $pull: { 'result.$[d].times': { time } } },
		{ new: true, arrayFilters: [{ 'd.date': date }] }
	);

	if (!updated) {
		return { status: 404, body: { message: 'No matching entry found' } };
	}

	await invalidateResultCaches(updated.categoryname, date);

	return {
		status: 200,
		body: { message: 'Time entry deleted successfully', updated },
	};
}

export async function addKeyForResultUpdation(body) {
	const { key, categoryname } = body;

	const keyExists = await CategoryKey.findOne({ key });
	if (!keyExists) {
		const nameExists = await CategoryKey.findOne({ categoryname });
		if (!nameExists) {
			const saved = await new CategoryKey({ key, categoryname }).save();
			try {
				await redis.del('categories:all');
			} catch (e) {
				console.error('[redis] addKey:', e.message);
			}
			return {
				status: 200,
				body: {
					baseResponse: { message: 'Key Added successfully', status: 1 },
					response: saved,
				},
			};
		}
	}

	return {
		status: 200,
		body: { baseResponse: { message: 'Key or Category already exists', status: 0 } },
	};
}
