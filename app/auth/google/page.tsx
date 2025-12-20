'use client';

import { Suspense } from 'react';
import { useSocialAuthenticateMutation } from '@/redux/features/authApiSlice';
import { useSocialAuth } from '@/hooks';
import { Spinner } from '@/components/common';

function GoogleAuthContent() {
	const [googleAuthenticate] = useSocialAuthenticateMutation();
	useSocialAuth(googleAuthenticate, 'google-oauth2');

	return (
		<div className='my-8'>
			<Spinner lg />
		</div>
	);
}

export default function Page() {
	return (
		<Suspense fallback={
			<div className='my-8'>
				<Spinner lg />
			</div>
		}>
			<GoogleAuthContent />
		</Suspense>
	);
}
