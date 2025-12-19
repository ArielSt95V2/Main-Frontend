'use client';

import { useVerify } from '@/hooks';
import { Toaster } from 'sonner';

export default function Setup() {
	useVerify();
	return <Toaster richColors position="top-right" />;
  }
