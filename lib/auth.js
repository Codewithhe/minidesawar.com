import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function generateAuthCode(userId) {
	if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyAuthToken(token) {
	if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
	return jwt.verify(token, JWT_SECRET);
}
