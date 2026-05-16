import { NextResponse } from 'next/server';

export function apiJson(data, status = 200) {
	return NextResponse.json(data, { status });
}

export function apiError(message, status = 500, extra = {}) {
	return apiJson({ message, ...extra }, status);
}
