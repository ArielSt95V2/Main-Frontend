import continueWithSocialAuth from './continue-with-social-auth';
import { mintTraceId } from '@/lib/traceId';

export const continueWithGoogle = () => {
	const traceId = mintTraceId();
	return continueWithSocialAuth('google-oauth2', 'google', traceId);
};
