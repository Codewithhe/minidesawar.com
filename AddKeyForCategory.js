'use client';
import axios from 'axios';

import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaEdit } from 'react-icons/fa';
import { MdDeleteForever } from 'react-icons/md';
import { MyVerticallyCenteredModal } from '@/EditEntries';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { HOST } from './static';
import { useRouter } from 'next/navigation';
const AddCategoryforkey = () => {
	const [results, setResults] = useState([]);
	const router = useRouter();
	const [form, setForm] = useState({
		categoryname: '',
		key: '',
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

	// Add new result row
	const addResultRow = () => {
		setForm({
			...form,
			result: [...form.result, { time: '', number: '' }],
		});
	};

	// Remove result row
	const removeResultRow = (index) => {
		const updatedResult = [...form.result];
		updatedResult.splice(index, 1);
		setForm({ ...form, result: updatedResult });
	};

	// Submit handler
	const handleAddResult = (e) => {
		e.preventDefault();
		console.log('Hit accepyed');
		const options = {
			method: 'POST',
			url: `${HOST}/add-key-for-result-updation`,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('authToken')}`,
			},
			data: {
				categoryname: form.categoryname,
				key: form.key,
			},
		};

		axios
			.request(options)
			.then(function (response) {
				alert(response.data.baseResponse.message);
			})
			.catch(function (error) {
				if (error.message.includes('403')) {
					router.push('/');
				}
			});

		// Reset form
		setForm({
			categoryname: '',
			key: '',
		});
	};

	// Delete entry
	const handleDelete = (id) => {
		setModalShow(true);
		setCatName(id);
	};

	return (
		<div className='container py-4'>
			<Row className='mb-4'>
				<Col md={12}>
					<Card>
						<Card.Header>Create Category</Card.Header>
						<Card.Body>
							<Form onSubmit={handleAddResult}>
								<Row className='g-3 container'>
									<Col md={4}>
										<Form.Select
											name='categoryname'
											value={form.categoryname}
											onChange={handleChange}
											required>
											<option value=''>Select Category</option>
											<option value='MiniDiswar'>MiniDiswar</option>
										</Form.Select>
									</Col>

									<Col md={4}>
										<Form.Control
											type='text'
											name='key'
											placeholder='Please enter key'
											value={form.key}
											onChange={handleChange}
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
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default AddCategoryforkey;
