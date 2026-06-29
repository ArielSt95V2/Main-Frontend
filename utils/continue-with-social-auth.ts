import { toast } from 'react-toastify';
import { mintTraceId, traceRequestHeaders } from '@/lib/traceId';
import { createLogger } from '@/lib/logger';

export default async function continueWithSocialAuth(
	provider: string,
	redirect: string,
	traceId?: string,
) {
	const id = traceId ?? mintTraceId();
	const log = createLogger('auth.social', id);
	log.info('click.social', 'Social sign-in started', {
		metadata: { provider, redirect },
	});

	try {
		const url = `${
			process.env.NEXT_PUBLIC_HOST
		}/api/o/${provider}/?redirect_uri=${
			process.env.NODE_ENV === 'production'
				? process.env.NEXT_PUBLIC_REDIRECT_URL
				: `https://${process.env.NEXT_PUBLIC_DOMAIN || 'localhost'}`
		}/auth/${redirect}`;

		const res = await fetch(url, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...traceRequestHeaders(id),
			},
			credentials: 'include',
		});
		const data = await res.json();

		if (res.status === 200 && typeof window !== 'undefined') {
			log.info('social.redirect.ok', 'Redirecting to OAuth provider', {
				metadata: { provider },
			});
			window.location.replace(data.authorization_url);
		} else {
			log.error('social.redirect.failed', 'OAuth redirect request failed', {
				userMessage: 'Something went wrong',
				metadata: { provider, status: res.status },
			});
			toast.error('Something went wrong');
		}
	} catch (err) {
		log.error('social.redirect.failed', 'OAuth redirect request failed', {
			userMessage: 'Something went wrong',
			metadata: {
				provider,
				reason: err instanceof Error ? err.message : 'unknown',
			},
		});
		toast.error('Something went wrong');
	}
}
