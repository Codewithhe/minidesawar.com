'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Card, Container, Alert, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { HOST } from '../../static';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import './Login.css';

const LoginForm = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const response = await fetch(`${HOST}/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || 'Login failed');
			}
			localStorage.setItem('email', email);
			localStorage.setItem('password', password);

			localStorage.setItem('authToken', data.authCode);
			router.push('/result-management');
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleForgotPassword = () => {
		// Replace with the correct reset password route
		router.push('/reset-password');
	};

	return (
		<div className='login-container'>
			<Container className='login-wrapper'>
				<Card className='login-card'>
					<Card.Body className='login-card-body'>
						<div className='login-header'>
							<h2 className='login-title'>
								<FiLogIn className='me-2' />
								Minidesawer
							</h2>
							<p className='login-subtitle'>Sign in to your admin account</p>
						</div>

						{error && (
							<Alert variant='danger' className='login-alert'>
								{error}
							</Alert>
						)}

						<Form onSubmit={handleSubmit} className='login-form'>
							<Form.Group className='mb-3' controlId='formEmail'>
								<Form.Label className='form-label-login'>
									<FiMail className='me-2' />
									Email address
								</Form.Label>
								<Form.Control
									type='email'
									placeholder='Enter your email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className='form-control-login'
									required
								/>
							</Form.Group>

							<Form.Group className='mb-4' controlId='formPassword'>
								<Form.Label className='form-label-login'>
									<FiLock className='me-2' />
									Password
								</Form.Label>
								<Form.Control
									type='password'
									placeholder='Enter your password'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className='form-control-login'
									required
								/>
							</Form.Group>

							<Button
								variant='primary'
								type='submit'
								className='login-btn w-100'
								disabled={loading}>
								{loading ? (
									<>
										<Spinner
											as='span'
											animation='border'
											size='sm'
											role='status'
											aria-hidden='true'
											className='me-2'
										/>
										Logging in...
									</>
								) : (
									<>
										<FiLogIn className='me-2' />
										Login
									</>
								)}
							</Button>
						</Form>

						{/* Forgot Password Link */}
						<div className='login-footer'>
							<Button
								variant='link'
								className='forgot-password-link'
								onClick={handleForgotPassword}>
								Forgot Password?
							</Button>
						</div>
					</Card.Body>
				</Card>
			</Container>
		</div>
	);
};

export default LoginForm;
