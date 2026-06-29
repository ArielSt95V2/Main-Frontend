import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { setAuth } from '@/redux/features/authSlice';
import { toast } from 'react-toastify';
import { mintTraceId } from '@/lib/traceId';
import { createLogger } from '@/lib/logger';

export default function useSocialAuth(authenticate: any, provider: string) {
	const dispatch = useAppDispatch();
	const router = useRouter();
	const searchParams = useSearchParams();

	const effectRan = useRef(false);

	useEffect(() => {
		const state = searchParams.get('state');
		const code = searchParams.get('code');

		if (state && code && !effectRan.current) {
			const traceId = mintTraceId();
			const log = createLogger('auth.social', traceId);

			log.info('social.callback.start', 'OAuth callback received', {
				metadata: { provider },
			});

			authenticate({ provider, state, code, traceId })
				.unwrap()
				.then(() => {
					log.info('social.ui.success', 'Social login succeeded', {
						metadata: { provider },
					});
					dispatch(setAuth());
					toast.success('Logged in');
					router.push('/dashboard');
				})
				.catch(() => {
					log.error('social.ui.failed', 'Social login failed', {
						userMessage: 'Failed to log in',
						metadata: { provider },
					});
					toast.error('Failed to log in');
					router.push('/auth/login');
				});
		}

		return () => {
			effectRan.current = true;
		};
	}, [authenticate, provider, dispatch, router, searchParams]);
}
