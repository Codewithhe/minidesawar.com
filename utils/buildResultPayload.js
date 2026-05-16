import moment from 'moment';
import { DEFAULT_CATEGORY_NAME } from './category';
import { RESULT_SLOT_TIME } from './scheduler';

/**
 * Build POST /api/result body — same shape the public website / Redis flow expects.
 */
export function buildResultPayload({
	categoryname = DEFAULT_CATEGORY_NAME,
	date,
	number,
	time = RESULT_SLOT_TIME,
	nextResult = RESULT_SLOT_TIME,
	key = 'md-9281',
	phone = '',
	isAutoScheduled = false,
}) {
	const slotTime = moment(time, ['hh:mm A', 'h:mm A', 'HH:mm', moment.ISO_8601], true).isValid()
		? moment(time, ['hh:mm A', 'h:mm A', 'HH:mm', moment.ISO_8601], true).format('hh:mm A')
		: RESULT_SLOT_TIME;
	const nextSlot = moment(nextResult, ['hh:mm A', 'h:mm A', 'HH:mm', moment.ISO_8601], true).isValid()
		? moment(nextResult, ['hh:mm A', 'h:mm A', 'HH:mm', moment.ISO_8601], true).format('hh:mm A')
		: slotTime;
	const numberStr = String(number ?? '').padStart(2, '0').slice(-2);

	return {
		categoryname,
		date,
		time: slotTime,
		number: numberStr,
		next_result: nextSlot,
		result: [{ time: slotTime, number: numberStr }],
		key,
		phone: phone || '',
		...(isAutoScheduled ? { isAutoScheduled: true } : {}),
	};
}
