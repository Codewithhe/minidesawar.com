'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Card, Container, Alert, Spinner, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { HOST } from '../../static';
import { FiMail, FiLock, FiKey, FiArrowLeft } from 'react-icons/fi';
import '../../Components/Authentication/Login.css';

const PasswordResetForm = () => {
	const [step, setStep] = useState(1);
	const [email, setEmail] = useState('');
	const [otp, setOtp] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [oldPassword, setOldPassword] = useState('');

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const router = useRouter();

	const generateOtp = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await fetch(`${HOST}/generate-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
			setStep(2);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const verifyOtp = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await fetch(`${HOST}/verify-otp`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, otp }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'OTP verification failed');
			setStep(3);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const resetPassword = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await fetch(`${HOST}/resetpassword`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, oldPassword, newPassword }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Password reset failed');
			// On success you might redirect to login
			router.push('/');
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='login-container'>
			<Container className='login-wrapper'>
				<Card className='login-card'>
					<Card.Body className='login-card-body'>
						<div className='login-header'>
							<h2 className='login-title'>
								<FiKey className='me-2' />
								Reset Password
							</h2>
							<p className='login-subtitle'>
								{step === 1 && 'Enter your email to receive OTP'}
								{step === 2 && 'Enter the OTP sent to your email'}
								{step === 3 && 'Set your new password'}
							</p>
							<div className='mt-2'>
								<Badge bg={step >= 1 ? 'primary' : 'secondary'} className='me-1'>
									1
								</Badge>
								<Badge bg={step >= 2 ? 'primary' : 'secondary'} className='me-1'>
									2
								</Badge>
								<Badge bg={step >= 3 ? 'primary' : 'secondary'}>3</Badge>
							</div>
						</div>

						{error && (
							<Alert variant='danger' className='login-alert'>
								{error}
							</Alert>
						)}

						{/* Step 1: Enter email & generate OTP */}
						{step === 1 && (
							<Form className='login-form'>
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
								<Button
									variant='primary'
									className='login-btn w-100'
									onClick={generateOtp}
									disabled={loading || !email}>
									{loading ? (
										<>
											<Spinner
												animation='border'
												size='sm'
												className='me-2'
											/>
											Sending OTP...
										</>
									) : (
										<>
											<FiKey className='me-2' />
											Generate OTP
										</>
									)}
								</Button>
							</Form>
						)}

						{/* Step 2: Enter OTP & verify */}
						{step === 2 && (
							<Form className='login-form'>
								<Form.Group className='mb-4' controlId='formOtp'>
									<Form.Label className='form-label-login'>
										<FiKey className='me-2' />
										OTP Code
									</Form.Label>
									<Form.Control
										type='text'
										placeholder='Enter 6-digit OTP'
										value={otp}
										onChange={(e) => {
											const val = e.target.value.replace(/\D/g, '').slice(0, 6);
											setOtp(val);
										}}
										maxLength={6}
										className='form-control-login'
										required
									/>
									<small className='form-text-muted'>
										Check your email for the OTP code
									</small>
								</Form.Group>
								<Button
									variant='primary'
									className='login-btn w-100 mb-3'
									onClick={verifyOtp}
									disabled={loading || !otp || otp.length !== 6}>
									{loading ? (
										<>
											<Spinner
												animation='border'
												size='sm'
												className='me-2'
											/>
											Verifying...
										</>
									) : (
										<>
											<FiKey className='me-2' />
											Verify OTP
										</>
									)}
								</Button>
								<Button
									variant='link'
									className='forgot-password-link w-100'
									onClick={() => setStep(1)}>
									<FiArrowLeft className='me-2' />
									Back to Email
								</Button>
							</Form>
						)}

						{/* Step 3: Enter New Password & reset */}
						{step === 3 && (
							<Form className='login-form'>
								<Form.Group className='mb-3' controlId='formOldPassword'>
									<Form.Label className='form-label-login'>
										<FiLock className='me-2' />
										Old Password
									</Form.Label>
									<Form.Control
										type='password'
										placeholder='Enter your old password'
										value={oldPassword}
										onChange={(e) => setOldPassword(e.target.value)}
										className='form-control-login'
										required
									/>
								</Form.Group>
								<Form.Group className='mb-4' controlId='formNewPassword'>
									<Form.Label className='form-label-login'>
										<FiLock className='me-2' />
										New Password
									</Form.Label>
									<Form.Control
										type='password'
										placeholder='Enter your new password'
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										className='form-control-login'
										required
									/>
									<small className='form-text-muted'>
										Use a strong password with at least 8 characters
									</small>
								</Form.Group>
								<Button
									variant='success'
									className='login-btn w-100'
									onClick={resetPassword}
									disabled={loading || !newPassword || !oldPassword}>
									{loading ? (
										<>
											<Spinner
												animation='border'
												size='sm'
												className='me-2'
											/>
											Resetting...
										</>
									) : (
										<>
											<FiKey className='me-2' />
											Reset Password
										</>
									)}
								</Button>
								<div className='login-footer mt-3'>
									<Button
										variant='link'
										className='forgot-password-link'
										onClick={() => setStep(2)}>
										<FiArrowLeft className='me-2' />
										Back to OTP
									</Button>
								</div>
							</Form>
						)}

						<div className='login-footer mt-3'>
							<Button
								variant='link'
								className='forgot-password-link'
								onClick={() => router.push('/')}>
								<FiArrowLeft className='me-2' />
								Back to Login
							</Button>
						</div>
					</Card.Body>
				</Card>
			</Container>
		</div>
	);
};

export default PasswordResetForm;
