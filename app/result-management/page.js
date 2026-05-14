'use client';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import moment from 'moment';
import { HOST } from '../../static';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { FiLogOut, FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import './admin.css';

const SCHEDULED_TIME = '19:30';
const EVENING_RESULT_TIME = '07:30 PM';

const getScheduledISOTime = (date = moment().format('YYYY-MM-DD')) =>
	moment(`${date} ${SCHEDULED_TIME}`, 'YYYY-MM-DD HH:mm').toISOString();

const normalizeTime = (time) => {
	const parsed = moment(time, ['hh:mm A', 'h:mm A', 'HH:mm', moment.ISO_8601], true);
	return parsed.isValid() ? parsed.format('hh:mm A') : '';
};

const isEveningResultTime = (time) => normalizeTime(time) === EVENING_RESULT_TIME;

const filterEveningResults = (items = []) =>
	items
		.map((res) => {
			const result = Array.isArray(res.result) ? res.result : [];
			const filteredResult = result
				.map((entry) => {
					if (Array.isArray(entry.times)) {
						const times = entry.times
							.filter((timeEntry) => isEveningResultTime(timeEntry.time))
							.map((timeEntry) => ({
								...timeEntry,
								time: normalizeTime(timeEntry.time),
							}));

						return times.length
							? {
									...entry,
									date: entry.date || res.date,
									times,
								}
							: null;
					}

					if (isEveningResultTime(entry.time)) {
						return {
							...entry,
							date: entry.date || res.date,
							times: [
								{
									time: normalizeTime(entry.time),
									number: entry.number,
								},
							],
						};
					}

					return null;
				})
				.filter(Boolean);

			return {
				...res,
				result: filteredResult,
			};
		})
		.filter((res) => res.result.length > 0);

const page = () => {
	const scheduledTimeISO = getScheduledISOTime();
	const router = useRouter();
	const [results, setResults] = useState([]);
	const [selectedResult, setSelectedResult] = useState(null); // for edit
	const [submitting, setSubmitting] = useState(false); // loading state for submit
	const [deleting, setDeleting] = useState(false); // loading state for delete
	const [form, setForm] = useState({
		categoryname: 'Minidesawer',
		date: moment().format('YYYY-MM-DD'),
		number: '', // Empty by default, user will enter manually
		phone: '',
		result: [{ time: '', number: '' }],
		next_result: scheduledTimeISO,
		key: 'md-9281',
		time: scheduledTimeISO,
	});

	// Logout function
	const handleLogout = () => {
		localStorage.removeItem('authToken');
		router.push('/');
	};

	const handleChange = (e) => {
		const { name, value } = e.target;

		if (name === 'time') {
			const selectedTime = moment(`${form.date}T${value}`, 'YYYY-MM-DDTHH:mm', true);
			if (!selectedTime.isValid()) return;

			setForm((prev) => ({
				...prev,
				time: selectedTime.toISOString(),
				next_result: selectedTime.toISOString(),
			}));
		} else if (name === 'date') {
			setForm((prev) => ({
				...prev,
				date: value,
				time: getScheduledISOTime(value),
				next_result: getScheduledISOTime(value),
			}));
		} else {
			setForm((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleAddResult = (e) => {
		e.preventDefault();
		setSubmitting(true);

				// Add new result
				axios
			.post(
				`${HOST}/result`,
				{
					categoryname: form.categoryname,
					time: moment(form.time).format('hh:mm A'),
					number: form.number,
					next_result: moment(form.next_result).format('hh:mm A'),
					result: [
						{
							time: moment(form.time).format('hh:mm A'),
							number: form.number,
						},
					],
					date: form.date,
					key: form.key,
					phone: form.phone || '',
					isManualEntry: true, // Flag to identify manual entries
				},
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${localStorage.getItem('authToken')}`,
					},
				}
			)
			.then((res) => {
				setSubmitting(false);
				if (res.data.message === 'Result saved successfully') {
					Swal.fire({
						icon: 'success',
						title: 'Success!',
						text: res.data.message,
						timer: 2000,
						showConfirmButton: false,
					});
					apiforResults();
					resetForm();
				} else if (res.data.message === 'Duplicate time(s) detected') {
					Swal.fire({
						icon: 'error',
						title: 'Error!',
						text: res.data.message,
						timer: 2000,
						showConfirmButton: false,
					});
					apiforResults();
				}
			})
			.catch((err) => {
				setSubmitting(false);
				console.error(err);
			});
	};

	const resetForm = () => {
		const defaultDate = moment().format('YYYY-MM-DD');
		const defaultScheduledTime = getScheduledISOTime(defaultDate);
		setForm({
			categoryname: 'Minidesawer',
			date: defaultDate,
			number: '', // Always empty after reset
			phone: '',
			result: [{ time: '', number: '' }],
			next_result: defaultScheduledTime,
			key: 'md-9281',
			time: defaultScheduledTime,
		});
		setSelectedResult(null);
	};

	const handleEdit = (res, date, time) => {
		setSelectedResult(res);
		setForm({
			categoryname: res.categoryname,
			date: res.date,
			number: res.number,
			result: res.result,
			next_result: res.next_result,
			key: res.key,
			time: res.time,
		});
		window.scrollTo({ top: 0, behavior: 'smooth' });
		router.push(`/edit?id=${res._id}&date=${date}&time=${time}`);
	};

	const apiforResults = () => {
		axios
			.get(`${HOST}/fetch-result`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('authToken')}`,
				},
			})
			.then((res) => {
				setResults(filterEveningResults(res.data.data));
			})
			.catch(console.error);
	};

	useEffect(() => {
		apiforResults();
	}, []);

	// Delete one time entry
	const handleDeleteTime = (id, time, date) => {
		console.log(date, time);
		if (!window.confirm(`Delete entry at ${time} on ${date}?`)) return;

		setDeleting(true);
		axios
			.patch(
				`${HOST}/delete-existing-result/${id}`,
				{ date, time },
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('authToken')}`,
					},
				}
			)
			.then(() => {
				setDeleting(false);
				apiforResults(); // reload list
			})
			.catch((err) => {
				setDeleting(false);
				console.error(err);
			});
	};

	return (
		<div className='admin-container'>
			{/* Overlay Loader */}
			{(submitting || deleting) && (
				<div className='overlay-loader'>
					<div className='loader-content'>
						<Spinner animation='border' variant='light' style={{ width: '3rem', height: '3rem' }} />
						<p className='loader-text'>
							{submitting ? 'Updating Number...' : 'Deleting Entry...'}
						</p>
					</div>
				</div>
			)}
			{/* Header with Logout */}
			<div className='admin-header'>
				<div className='admin-header-content'>
					<div className='admin-header-left'>
						<h1 className='admin-title'>Minidesawer</h1>
						<p className='header-mantra'>ॐ नमो भगवते वासुदेवाय नमः</p>
					</div>
					<div className='admin-header-right'>
						<Button
							variant='danger'
							size='sm'
							className='logout-btn'
							onClick={handleLogout}>
							<FiLogOut className='me-1' />
							Logout
						</Button>
					</div>
				</div>
			</div>

			<div className='admin-content'>
		

			<Tabs
				defaultActiveKey='result'
				id='tabs-example'
				className='admin-tabs'>
				<Tab
					eventKey='result'
					title={<span className='tab-title'><FiPlus className='me-1' /> Add Result</span>}>
					<Row className='mb-4'>
						<Col xs={12}>
							<Card className='admin-card'>
								<Card.Header className='admin-card-header'>
									<h3 className='mb-0'>
										{selectedResult ? (
											<><FiEdit2 className='me-2' />Edit Result</>
										) : (
											<><FiPlus className='me-2' />Create New Result</>
										)}
									</h3>
								</Card.Header>
								<Card.Body className='admin-card-body'>
									<Form onSubmit={handleAddResult}>
										<Row className='g-3'>
											<Col xs={12} sm={6} md={3}>
												<Form.Label className='form-label-custom'>Date</Form.Label>
												<Form.Control
													type='date'
													name='date'
													value={form.date}
													min={moment().format('YYYY-MM-DD')}
													onChange={handleChange}
													className='form-control-custom'
													required
												/>
											</Col>
											<Col xs={12} sm={6} md={3}>
												<Form.Label className='form-label-custom'>Result</Form.Label>
												<Form.Control
													type='text'
													name='number'
													value={form.number}
													onChange={(e) => {
														const val = e.target.value.replace(/\D/g, '');
														if (val.length <= 2) {
															setForm((prev) => ({
																...prev,
																number: val,
															}));
														}
													}}
													maxLength={2}
													required
													placeholder='Enter number (2 digits)'
													className='form-control-custom number-input-large'
												/>
												{form.number?.length > 0 &&
													form.number?.length !== 2 && (
														<div className='form-error'>
															Number must be exactly 2 digits.
														</div>
													)}
											</Col>
											<Col xs={12} sm={6} md={3}>
												<Form.Label className='form-label-custom'>Evening Result Time</Form.Label>
												<Form.Control
													type='time'
													name='time'
													value={moment(form.time).format('HH:mm')}
													disabled
													className='form-control-custom'
													required
												/>
											</Col>
											<Col xs={12} sm={6} md={3}>
												<Form.Label className='form-label-custom'>Next Result Time</Form.Label>
												<Form.Control
													type='time'
													name='next_result'
													value={moment(form.next_result).format('HH:mm')}
													disabled
													className='form-control-custom'
												/>
											</Col>
											{/* Hidden fields - still sent to backend */}
											<Form.Control
												type='hidden'
												name='categoryname'
												value={form.categoryname}
											/>
											<Form.Control
												type='hidden'
												name='key'
												value={form.key}
											/>
											<Form.Control
												type='hidden'
												name='phone'
												value={form.phone}
											/>
										</Row>
										<div className='form-actions'>
											<Button
												type='submit'
												variant='primary'
												className='submit-btn'
												disabled={submitting}>
												{submitting ? (
													<>
														<Spinner animation='border' size='sm' className='me-2' />
														Updating...
													</>
												) : (
													selectedResult ? 'Update Result' : 'Submit'
												)}
											</Button>
											{selectedResult && (
												<Button
													className='cancel-btn'
													variant='secondary'
													onClick={resetForm}>
													<FiX className='me-1' />
													Cancel
												</Button>
											)}
										</div>
									</Form>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>
				<Tab
					eventKey='result-list'
					title={<span className='tab-title'>Result List</span>}>
					<Row>
						<Col xs={12}>
							<Card className='admin-card'>
								<Card.Header className='admin-card-header'>
									<h3 className='mb-0'>Results List</h3>
									<Badge bg='primary' className='ms-2'>
										{results.length} {results.length === 1 ? 'Evening Result' : 'Evening Results'}
									</Badge>
								</Card.Header>
								<Card.Body className='admin-card-body'>
									<div className='table-responsive-wrapper'>
										<Table
											striped
											bordered
											hover
											responsive
											className='admin-table'>
											<thead>
												<tr>
													<th>Result Entries</th>
												</tr>
											</thead>
											<tbody>
												{results.length === 0 ? (
													<tr>
														<td className='text-center py-4'>
															<p className='text-muted mb-0'>No 7:30 PM results found</p>
														</td>
													</tr>
												) : (
													results.map((res) => (
														<tr key={res._id}>
															{/* Show each result entry with independent buttons */}
															<td className='result-entries-cell'>
																{res.result.map((r, dateIdx) => {
																	return (
																		<div
																			key={dateIdx}
																			className='result-entry-item'>
																			<strong className='result-date'>{r.date}</strong>
																			{r.times?.map((t, timeIdx) => {
																				return (
																					<div
																						key={timeIdx}
																						className='result-time-entry'>
																						<span className='result-time-badge'>
																							{t.time} - {t.number}
																						</span>
																						<div className='result-entry-actions'>
																							<Button
																								size='sm'
																								variant='warning'
																								className='action-btn'
																								disabled={submitting || deleting}
																								onClick={() =>
																									handleEdit(res, r.date, t.time)
																								}>
																								<FiEdit2 />
																							</Button>
																							<Button
																								size='sm'
																								variant='danger'
																								className='action-btn'
																								disabled={deleting}
																								onClick={() =>
																									handleDeleteTime(
																										res._id,
																										t.time,
																										r.date
																									)
																								}>
																								{deleting ? (
																									<Spinner animation='border' size='sm' />
																								) : (
																									<FiTrash2 />
																								)}
																							</Button>
																						</div>
																					</div>
																				);
																			})}
																		</div>
																	);
																})}
															</td>
														</tr>
													))
												)}
											</tbody>
										</Table>
									</div>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>
				<Tab
					eventKey='number'
					title={<span className='tab-title'>Number</span>}>
					<Row>
						<Col xs={12}>
							<Card className='admin-card'>
								<Card.Header className='admin-card-header'>
									<h3 className='mb-0'>Numbers Table</h3>
									<Badge bg='primary' className='ms-2'>
										{results.length} {results.length === 1 ? 'Evening Entry' : 'Evening Entries'}
									</Badge>
								</Card.Header>
								<Card.Body className='admin-card-body'>
									<div className='table-responsive-wrapper'>
										<Table
											striped
											bordered
											hover
											responsive
											className='admin-table'>
											<thead>
												<tr>
													<th>#</th>
													<th>Date</th>
													<th>Time</th>
													<th>Number</th>
													<th>Category</th>
												</tr>
											</thead>
											<tbody>
												{results.length === 0 ? (
													<tr>
														<td colSpan='5' className='text-center py-4'>
															<p className='text-muted mb-0'>No 7:30 PM numbers found</p>
														</td>
													</tr>
												) : (
													results.flatMap((res) => {
														// Handle different data structures
														const numbers = [];
														
														// If result has times array structure
														if (res.result && Array.isArray(res.result)) {
															res.result.forEach((r, dateIdx) => {
																if (r.times && Array.isArray(r.times)) {
																	r.times.forEach((t, timeIdx) => {
																		numbers.push({
																			id: `${res._id}-${dateIdx}-${timeIdx}`,
																			date: r.date || res.date,
																			time: t.time,
																			number: t.number,
																			category: res.categoryname,
																		});
																	});
																} else if (r.time && r.number) {
																	// Handle simple {time, number} structure
																	numbers.push({
																		id: `${res._id}-${dateIdx}`,
																		date: r.date || res.date,
																		time: r.time,
																		number: r.number,
																		category: res.categoryname,
																	});
																}
															});
														}
														
														// Also include main number if it exists and no result entries
														if (numbers.length === 0 && res.number) {
															numbers.push({
																id: `${res._id}-main`,
																date: res.date,
																time: res.time || 'N/A',
																number: res.number,
																category: res.categoryname,
															});
														}
														
														return numbers.map((num) => (
															<tr key={num.id}>
																<td className='id-cell'>{res._id.slice(-6)}</td>
																<td>{num.date}</td>
																<td>
																	<Badge bg='info'>{num.time}</Badge>
																</td>
																<td>
																	<Badge bg='success' className='number-badge-large'>{num.number}</Badge>
																</td>
																<td>
																	<Badge bg='secondary'>{num.category}</Badge>
																</td>
															</tr>
														));
													})
												)}
											</tbody>
										</Table>
									</div>
								</Card.Body>
							</Card>
						</Col>
					</Row>
				</Tab>
			</Tabs>
		</div>
	</div>
	);
};

export default page;
