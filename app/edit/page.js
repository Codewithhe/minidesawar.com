'use client';
import React, { Suspense } from 'react';
import EditResultPage from '../../Components/Edit/editresult';
export default function EditResultPageWrapper() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<EditResultPage />
		</Suspense>
	);
}
