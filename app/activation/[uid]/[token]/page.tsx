'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useActivationMutation } from '@/redux/features/authApiSlice';
import { toast } from 'react-toastify';
import { mintTraceId } from '@/lib/traceId';
import { createLogger } from '@/lib/logger';

export default function Page() {
	const router = useRouter();
	const params = useParams();
	const [activation] = useActivationMutation();
	const startedRef = useRef(false);

	useEffect(() => {
		if (startedRef.current) return;

		const uid = params?.uid as string;
		const token = params?.token as string;
		if (!uid || !token) return;

		startedRef.current = true;
		const traceId = mintTraceId();
		const log = createLogger('auth.activation', traceId);

		log.info('activation.start', 'Account activation started');

		activation({ uid, token, traceId })
			.unwrap()
			.then(() => {
				log.info('activation.ui.success', 'Account activated');
				toast.success('Account activated');
			})
			.catch(() => {
				log.error('activation.ui.failed', 'Account activation failed', {
					userMessage: 'Failed to activate account',
				});
				toast.error('Failed to activate account');
			})
			.finally(() => {
				router.push('/auth/login');
			});
	}, [params, activation, router]);

	return (
		<div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
			<div className='sm:mx-auto sm:w-full sm:max-w-sm'>
				<h1 className='mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>
					Activating your account...
				</h1>
			</div>
		</div>
	);
}
