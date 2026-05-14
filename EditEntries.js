import React from 'react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { Table, Button, Form, Row, Col, Card } from 'react-bootstrap';
import moment from 'moment';
import { HOST } from './static';

export const MyVerticallyCenteredModal = (props) => {
	const [results, setResults] = useState([]);
	const [modalShow, setModalShow] = React.useState(false);

	const { catname } = props;
	const [form, setForm] = useState({
		categoryname: catname,
		time: '',
		number: '',
		next_result: '',
	});

	// Handle top-level input change
	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	// Handle dynamic result field change
	const handleResultChange = (index, field, value) => {
		const updatedResult = [...form.result];
		updatedResult[index][field] = value;
		setForm({ ...form, result: updatedResult });
	};
	const handleAddResult = (e) => {
		e.preventDefault();

		const options = {
			method: 'PUT',
			url: `${HOST}/update-existing-result/${catname}`,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('authToken')}`,
			},
			data: {
				categoryname: catname,
				time: moment(form.time).format('hh:mm A'),
				number: form.number,
				next_result: moment(form.time).format('hh:mm A'),
			},
		};
		axios
			.request(options)
			.then(function (response) {
				console.log(response.data);
			})
			.catch(function (error) {
				console.error(error);
			});

		// Reset form
		setForm({
			time: '',
			number: '',
			next_result: '',
		});
	};

	return (
		<Modal
			{...props}
			size='lg'
			aria-labelledby='contained-modal-title-vcenter'
			centered>
			<Modal.Header closeButton></Modal.Header>
			<Modal.Body>
				<Form onSubmit={handleAddResult}>
					<Row className='g-3 container'>
						<Col md={4}>
							<label>Time</label>
							<Form.Control
								id='time'
								type='time'
								name='time'
								placeholder='Time'
								value={moment(form.time).format('HH:mm')}
								onChange={(e) => {
									const time = e.target.value;
									const selectedTime = moment(time, 'HH:mm');
									const isoTime = selectedTime.isValid()
										? selectedTime.seconds(0).format('YYYY-MM-DDTHH:mm:ss')
										: '';

									handleChange({
										target: {
											name: 'time',
											value: isoTime,
										},
									});
								}}
								required
							/>
						</Col>
						<Col md={4}>
							<label>Number</label>

							<Form.Control
								type='number'
								name='number'
								placeholder='Number'
								value={form.number}
								onChange={handleChange}
								required
							/>
						</Col>

						<Col
							md={4}
							className='mt-3'>
							<label>Next Result</label>

							<Form.Control
								id='next_result'
								type='time'
								name='next_result'
								placeholder='Next Result'
								value={moment(form.next_result).format('HH:mm')}
								onChange={(e) => {
									const time = e.target.value;
									const selectedTime = moment(time, 'HH:mm');
									const isoTime = selectedTime.isValid()
										? selectedTime.seconds(0).format('YYYY-MM-DDTHH:mm:ss')
										: '';

									handleChange({
										target: {
											name: 'next_result',
											value: isoTime,
										},
									});
								}}
								required
							/>
						</Col>
					</Row>

					<div className='mt-3 text-end'>
						<Button
							type='submit'
							variant='primary'>
							Submit Result
						</Button>
					</div>
				</Form>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={props.onHide}>Close</Button>
			</Modal.Footer>
		</Modal>
	);
};
