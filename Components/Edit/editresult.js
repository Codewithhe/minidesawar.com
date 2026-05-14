'use client';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Button, Form, Row, Col, Card, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { HOST } from '../../static';
import moment from 'moment';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import '../../app/result-management/admin.css';

const EditResultPage = () => {
	const router = useRouter();
	const searchParams = useSearchParams();

	// ✅ Safe way to read params (no Suspense needed)
	const id = searchParams?.get('id');
	const date = searchParams?.get('date');
	const time = searchParams?.get('time');

	const [timess, setTimess] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState({
		categoryname: '',
		date: moment().format('YYYY-MM-DD'),
		number: '',
		result: [],
		next_result: '',
		key: '',
		time: '',
	});

	// Separate selections
	const [selectedDateIdx, setSelectedDateIdx] = useState(null);
	const [selectedTimeIdx, setSelectedTimeIdx] = useState(null);

	useEffect(() => {
		if (id) {
			axios
				.get(`${HOST}/result/${id}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('authToken')}`,
					},
				})
				.then((res) => {
					const data = res.data.response;

					if (data) {
						// Find the date entry that matches the URL param
						const dateEntry = data.result.find((r) => r.date === date);

						// Get times array for the selected date
						const timesArray = dateEntry ? dateEntry.times : [];
						setTimess(timesArray);

						// Find the time entry that matches the URL param
						const timeEntry = timesArray.find((t) => t.time === time);

						setForm({
							categoryname: data.categoryname,
							date: date || data.date,
							number: timeEntry ? timeEntry.number : '',
							result: data.result || [],
							next_result: data.next_result,
							key: data.key,
							time: timeEntry ? timeEntry.time : '',
						});

						// Set selected indices for dropdowns
						const dateIdx = data.result.findIndex((r) => r.date === date);
						setSelectedDateIdx(dateIdx !== -1 ? dateIdx : null);

						const timeIdx = timesArray.findIndex((t) => t.time === time);
						setSelectedTimeIdx(timeIdx !== -1 ? timeIdx : null);

						setLoading(false);
					}
				})
				.catch((err) => {
					console.error(err);
					setLoading(false);
				});
		}
	}, [id, date, time]);

	// Handle selecting date
	const handleSelectDate = (e) => {
		const idx = Number(e.target.value);
		setSelectedDateIdx(idx);
		setSelectedTimeIdx(null); // reset time selection
		setForm((prev) => ({
			...prev,
			time: '',
			number: '',
		}));
	};

	// Handle selecting time
	const handleSelectTime = (e) => {
		const idx = Number(e.target.value);
		setSelectedTimeIdx(idx);

		const selected = form.result[selectedDateIdx].times[idx];
		setForm((prev) => ({
			...prev,
			time: selected.time, // already AM/PM format
			number: selected.number,
		}));
	};

	// Handle input changes
	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Handle Update
	const handleUpdate = (e) => {
		e.preventDefault();
		if (selectedDateIdx === null || selectedTimeIdx === null) {
			alert('Please select a date and time entry');
			return;
		}

		const dateEntry = form.result[selectedDateIdx];
		const timeEntry = dateEntry.times[selectedTimeIdx];

		setSaving(true);

		axios
			.put(
				`${HOST}/update-existing-result/${id}`,
				{
					date: dateEntry.date, // ✅ exact date string
					time: timeEntry.time, // ✅ exact time string with AM/PM
					number: form.number,
					next_result: form.next_result,
				},
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${localStorage.getItem('authToken')}`,
					},
				}
			)
			.then((res) => {
				setSaving(false);
				if (res.data.message === 'Result updated successfully') {
					Swal.fire({
						icon: 'success',
						title: 'Success!',
						text: res.data.message,
						timer: 2000,
						showConfirmButton: false,
					});
					router.push('/result-management');
				} else {
					Swal.fire({
						icon: 'error',
						title: 'Error!',
						text: res.data.message,
						timer: 2000,
						showConfirmButton: false,
					});
				}
			})
			.catch((err) => {
				console.error(err);
				setSaving(false);
			});
	};

	if (loading) {
		return (
			<div className='admin-container edit-admin-shell'>
				<div className='edit-loader-panel'>
					<Spinner animation='border' />
					<p>Loading result editor...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='admin-container edit-admin-shell'>
			{/* Overlay Loader */}
			{saving && (
				<div className='overlay-loader'>
					<div className='loader-content'>
						<Spinner animation='border' variant='light' style={{ width: '3rem', height: '3rem' }} />
						<p className='loader-text'>Updating Number...</p>
					</div>
				</div>
			)}
			<div className='edit-layout'>
				<div className='edit-hero-panel'>
					<span className='eyebrow-label'>Result Operations</span>
					<h1>Edit Evening Result</h1>
					<p>Update the selected date and time entry without changing the rest of the record.</p>
					<div className='edit-meta-grid'>
						<div>
							<span>Category</span>
							<strong>{form.categoryname || 'N/A'}</strong>
						</div>
						<div>
							<span>Selected Date</span>
							<strong>{date || form.date}</strong>
						</div>
						<div>
							<span>Selected Time</span>
							<strong>{time || form.time || 'N/A'}</strong>
						</div>
					</div>
				</div>

			<Card className='edit-command-card'>
				<Card.Header className='edit-command-header'>Modify Entry</Card.Header>
				<Card.Body className='edit-command-body'>
					<Form onSubmit={handleUpdate}>
						<Row className='g-3'>
							{/* Category */}
							<Col md={4}>
								<Form.Label className='form-label-custom'>Category</Form.Label>
								<Form.Control
									type='text'
									name='categoryname'
									value={form.categoryname}
									onChange={handleChange}
									className='form-control-custom'
									required
								/>
							</Col>
							{/* Key */}
							<Col md={4}>
								<Form.Label className='form-label-custom'>Key</Form.Label>
								<Form.Control
									type='text'
									name='key'
									value={form.key}
									onChange={handleChange}
									className='form-control-custom'
									required
								/>
							</Col>
							{/* Main Date */}
							<Col md={4}>
								<Form.Label className='form-label-custom'>Main Date</Form.Label>
								<Form.Control
									type='date'
									name='date'
									value={form.date}
									onChange={handleChange}
									className='form-control-custom'
									required
								/>
							</Col>

							{/* Select Date Entry */}
							<Col
								md={6}
								className='mt-3'>
								<Form.Label className='form-label-custom'>Select Date Entry</Form.Label>
								<Form.Select
									className='form-control-custom'
									onChange={handleSelectDate}
									value={selectedDateIdx ?? ''}>
									<option
										value=''
										disabled>
										-- Choose Date --
									</option>
									{form.result.map((r, idx) => (
										<option
											key={idx}
											value={idx}>
											{r.date}
										</option>
									))}
								</Form.Select>
							</Col>

							{/* Select Time Entry */}
							<Col
								md={6}
								className='mt-3'>
								<Form.Label className='form-label-custom'>Select Time Entry</Form.Label>
								<Form.Select
									className='form-control-custom'
									onChange={handleSelectTime}
									value={selectedTimeIdx ?? ''}>
									<option
										value=''
										disabled>
										-- Choose Time --
									</option>
									{timess.map((t, idx) => (
										<option
											key={idx}
											value={idx}>
											{t.time}
										</option>
									))}
								</Form.Select>
							</Col>

							{/* Number */}
							<Col
								md={6}
								className='mt-3'>
								<Form.Label className='form-label-custom'>Number</Form.Label>
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
									className='form-control-custom number-input-large'
									disabled={selectedTimeIdx === null}
									required
								/>
							</Col>
						</Row>

						{/* Buttons */}
						<div className='edit-actions'>
							<Button
								type='submit'
								variant='primary'
								className='submit-btn'
								disabled={saving}>
								{saving ? 'Updating...' : 'Update Result'}
							</Button>
							<Button
								className='cancel-btn'
								variant='secondary'
								onClick={() => router.push('/')}>
								Cancel
							</Button>
						</div>
					</Form>
				</Card.Body>
			</Card>
			</div>
		</div>
	);
};

export default EditResultPage;
