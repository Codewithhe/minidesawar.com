import moment from 'moment';
import axios from 'axios';
import { HOST } from '../static';
import { buildResultPayload } from './buildResultPayload';
import { extractResultsPayload, normalizeResultTime } from './resultPayload';

/** Fixed daily result slot (3:45 PM local) — must match public website display time */
export const SCHEDULER_HOUR = 15;
export const SCHEDULER_MINUTE = 45;
export const SCHEDULED_TIME_24H = '15:45';
export const RESULT_SLOT_TIME = '03:45 PM';

/**
 * Get today's scheduler slot at 3:45 PM
 */
export const getTodaySchedulerSlot = () =>
	moment()
		.hour(SCHEDULER_HOUR)
		.minute(SCHEDULER_MINUTE)
		.second(0)
		.millisecond(0);

/**
 * Get the next scheduler trigger time (today or tomorrow 3:45 PM)
 */
export const getNextSchedulerTime = () => {
	const now = moment();
	const todaySlot = getTodaySchedulerSlot();

	if (now.isSameOrAfter(todaySlot)) {
		return todaySlot.clone().add(1, 'day');
	}

	return todaySlot;
};

/**
 * Check if current time is exactly 3:45 PM
 */
export const isSchedulerTriggerTime = () => {
	const now = moment();
	return (
		now.hour() === SCHEDULER_HOUR &&
		now.minute() === SCHEDULER_MINUTE &&
		now.second() === 0
	);
};

/**
 * Check if a manual entry exists for 3:45 PM today
 */
export const checkManualEntryExists = async (targetTime, date) => {
	try {
		const response = await axios.get(`${HOST}/fetch-result`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('authToken')}`,
			},
		});

		const results = extractResultsPayload(response.data);
		const dateFormatted = date || moment().format('YYYY-MM-DD');

		const targetDisplay = targetTime.format('hh:mm A');

		// Check if any result has an entry for this exact scheduler time
		for (const result of results) {
			if (result.date === dateFormatted) {
				// Check in result array
				if (result.result && Array.isArray(result.result)) {
					for (const entry of result.result) {
						if (entry.times && Array.isArray(entry.times)) {
							for (const timeEntry of entry.times) {
							if (normalizeResultTime(timeEntry.time) === targetDisplay) {
									return true; // Manual entry exists in this slot
								}
							}
						} else if (entry.time) {
							if (normalizeResultTime(entry.time) === targetDisplay) {
								return true; // Manual entry exists in this slot
							}
						}
					}
				}
				if (normalizeResultTime(result.time) === targetDisplay) {
					return true; // Manual entry exists in this slot
				}
			}
		}

		return false; // No manual entry found
	} catch (error) {
		console.error('Error checking manual entry:', error);
		return true; // On error, assume entry exists (safer to not send auto)
	}
};

/**
 * Send automatic number via scheduler
 */
export const sendAutoNumber = async (timeSlot, number = '00') => {
	try {
		const date = moment().format('YYYY-MM-DD');
		const timeFormatted = timeSlot.format('hh:mm A');

		const response = await axios.post(
			`${HOST}/result`,
			buildResultPayload({
				date,
				number,
				time: timeFormatted,
				nextResult: timeFormatted,
				isAutoScheduled: true,
			}),
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('authToken')}`,
				},
			}
		);

		return response.data;
	} catch (error) {
		console.error('Error sending auto number:', error);
		throw error;
	}
};

/**
 * Main scheduler function
 * Should be called every second to check if it's time to trigger
 * Only runs if scheduler is enabled
 */
export const runScheduler = async () => {
	// Check if scheduler is enabled from localStorage (only in browser)
	if (typeof window !== 'undefined') {
		const schedulerEnabled = localStorage.getItem('schedulerEnabled');
		if (schedulerEnabled === 'false') {
			return false; // Scheduler is disabled
		}
	}
	
	if (!isSchedulerTriggerTime()) {
		return false;
	}

	const timeSlot = getTodaySchedulerSlot();
	const date = moment().format('YYYY-MM-DD');

	// Check if manual entry exists
	const manualEntryExists = await checkManualEntryExists(timeSlot, date);

	if (manualEntryExists) {
		console.log(`Scheduler: Manual entry exists for ${timeSlot.format('hh:mm A')}, skipping auto send`);
		return false;
	}

	// No manual entry, send auto number
	console.log(`Scheduler: Sending auto number for ${timeSlot.format('hh:mm A')}`);
	try {
		await sendAutoNumber(timeSlot);
		console.log(`Scheduler: Auto number sent successfully for ${timeSlot.format('hh:mm A')}`);
		return true;
	} catch (error) {
		console.error('Scheduler: Failed to send auto number:', error);
		return false;
	}
};

