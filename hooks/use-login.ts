import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { useLoginMutation } from '@/redux/features/authApiSlice';
import { setAuth } from '@/redux/features/authSlice';
import { toast } from 'react-toastify';

import { mintTraceId } from "@/lib/traceId";
import { createLogger } from "@/lib/logger";

export default function useLogin() {
	const router = useRouter();
	const dispatch = useAppDispatch();
	const [login, { isLoading }] = useLoginMutation();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	const { email, password } = formData;

	const onChange = (event: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = event.target;

		setFormData({ ...formData, [name]: value });
	};

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		// Log the form submission
		const traceId = mintTraceId();
		const log = createLogger("auth.login", traceId);
		log.info("click.login", "Login form submitted");

		login({ email, password, traceId })
			.unwrap()
			.then(() => {
				// Log the success
				log.info("login.ui.success", "Login succeeded; redirecting to dashboard");
				dispatch(setAuth());
				toast.success('Logged in');
				router.push('/dashboard');
			})
			.catch(() => {
				// Log the failure
				log.error("login.ui.failed", "Login failed", {
					userMessage: "Failed to log in",
				});
				toast.error('Failed to log in');
			});
	};

	return {
		email,
		password,
		isLoading,
		onChange,
		onSubmit,
	};
}
