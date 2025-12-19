# UI & Coding Standards Document

## Overview

This document establishes UI and coding standards derived from the existing codebase to ensure consistency, scalability, and rapid feature development. The standards are based on patterns found in `full-auth/` components and pages.

**Purpose**: Enable the team to focus on UX and features, not visual design decisions. All new components and features should follow these established patterns.

---

## 1. Technology Stack & Dependencies

### Core Framework
- **Next.js 13+** (App Router) with React 18
- **TypeScript** (strict mode enabled)
- **Tailwind CSS** with `@tailwindcss/forms` plugin

### Key Libraries
- **State Management**: Redux Toolkit (RTK Query)
- **UI Components**: Headless UI, Heroicons, React Icons
- **Utilities**: 
  - `classnames` (imported as `cn`) for conditional classes
  - `react-toastify` / `sonner` for notifications
  - `async-mutex` for async operations

### Path Aliases
- `@/*` maps to project root (configured in `tsconfig.json`)

---

## 2. Component Architecture Standards

### 2.1 Component Organization

Components are organized by domain/functionality:

```
components/
├── common/          # Reusable UI elements (Navbar, Footer, Spinner, List)
├── forms/           # Form-specific components (Form, Input, LoginForm)
└── utils/           # HOCs and utility components (RequireAuth, Setup)
```

**Rules**:
- Each folder contains related components
- Each folder has an `index.ts` barrel export file
- Components use default exports
- Re-export via `index.ts` for clean imports

### 2.2 Component File Structure

**File Naming**: PascalCase for component files
- ✅ `LoginForm.tsx`
- ✅ `SocialButton.tsx`
- ❌ `login-form.tsx`
- ❌ `socialButton.tsx`

**Standard Component Template**:

```typescript
interface Props {
  // TypeScript interface for all props
  prop1: string;
  prop2?: number; // Optional props marked with ?
  children?: React.ReactNode;
}

export default function ComponentName({ prop1, prop2, children }: Props) {
  // Component logic here
  
  return (
    // JSX here
  );
}
```

**Example from codebase**:

```17:25:full-auth/components/forms/Input.tsx
export default function Input({
	labelId,
	type,
	onChange,
	value,
	children,
	link,
	required = false,
}: Props) {
```

### 2.3 Component Categories

#### Common Components (`components/common/`)
Reusable UI elements used across the application:
- `Navbar` - Navigation bar with authentication-aware links
- `Footer` - Site footer
- `Spinner` - Loading indicator with size variants
- `List` - Config-driven list display
- `NavLink` - Navigation link with active state
- `SocialButton` - Social authentication button
- `SocialButtons` - Container for social auth buttons

#### Form Components (`components/forms/`)
Form-specific UI components:
- `Form` - Base form component accepting config array
- `Input` - Reusable input with label and optional link
- `LoginForm` - Login form container component
- `RegisterForm` - Registration form container component
- `PasswordResetForm` - Password reset form
- `PasswordResetConfirmForm` - Password reset confirmation form

#### Utility Components (`components/utils/`)
Higher-order components and wrappers:
- `RequireAuth` - HOC for protected routes
- `Setup` - App initialization component

---

## 3. Styling Standards

### 3.1 Tailwind CSS Philosophy

**Core Principles**:
- **Utility-first**: Use Tailwind classes directly, avoid custom CSS
- **Mobile-first**: Design for mobile, enhance for larger screens
- **Consistent spacing**: Use Tailwind's spacing scale
- **No custom CSS**: Only use `globals.css` for Tailwind directives

**Responsive Breakpoints**:
- Default: Mobile (< 640px)
- `sm:` - Small screens (≥ 640px)
- `lg:` - Large screens (≥ 1024px)

### 3.2 Color Palette

#### Primary Colors
- **Primary**: `indigo-600` (default state)
- **Primary Hover**: `indigo-500`
- **Primary Focus**: `indigo-600` with outline ring

#### Text Colors
- **Primary Text**: `text-gray-900`
- **Secondary Text**: `text-gray-600`
- **Muted Text**: `text-gray-500` or `text-gray-400`
- **White Text**: `text-white` (on colored backgrounds)

#### Background Colors
- **Page Background**: `bg-white`
- **Navbar**: `bg-gray-800`
- **Footer**: `bg-gray-100`
- **Selected State**: `bg-gray-900` (navbar items)

#### Social Button Colors
- **Google**: `bg-red-500` / `hover:bg-red-400`
- **Facebook**: `bg-blue-500` / `hover:bg-blue-400`

### 3.3 Common Class Patterns

#### Primary Button
```typescript
className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
```

**Usage**: Submit buttons, primary CTAs

**Example**:
```49:55:full-auth/components/forms/Form.tsx
			<button
				type='submit'
				className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				disabled={isLoading}
			>
				{isLoading ? <Spinner sm /> : `${btnText}`}
			</button>
```

#### Input Field
```typescript
className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
```

**Usage**: All text inputs, email inputs, password fields

**Example**:
```47:55:full-auth/components/forms/Input.tsx
			<div className='mt-2'>
				<input
					id={labelId}
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
					name={labelId}
					type={type}
					onChange={onChange}
					value={value}
					required={required}
```

#### Label
```typescript
className='block text-sm font-medium leading-6 text-gray-900'
```

**Usage**: Form field labels

**Example**:
```29:34:full-auth/components/forms/Input.tsx
				<label
					htmlFor={labelId}
					className='block text-sm font-medium leading-6 text-gray-900'
				>
					{children}
				</label>
```

#### Link
```typescript
className='font-semibold text-indigo-600 hover:text-indigo-500'
```

**Usage**: Inline links, navigation links

**Example**:
```31:36:full-auth/app/auth/login/page.tsx
					<Link
						href='/auth/register'
						className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'
					>
						Register here
					</Link>
```

#### Page Container
```typescript
className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'
```

**Usage**: Main content containers, page wrappers

**Example**:
```26:28:full-auth/app/layout.tsx
					<div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-8'>
						{children}
					</div>
```

#### Auth Page Container
```typescript
className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'
```

**Usage**: Login, register, and other auth pages

**Example**:
```13:13:full-auth/app/auth/login/page.tsx
		<div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
```

#### Centered Content Box
```typescript
className='sm:mx-auto sm:w-full sm:max-w-sm'
```

**Usage**: Form containers, centered content areas

**Example**:
```14:14:full-auth/app/auth/login/page.tsx
			<div className='sm:mx-auto sm:w-full sm:max-w-sm'>
```

#### Loading Spinner Container
```typescript
className='flex justify-center my-8'
```

**Usage**: Centering loading spinners

**Example**:
```26:28:full-auth/app/dashboard/page.tsx
		return (
			<div className='flex justify-center my-8'>
				<Spinner lg />
```

### 3.4 Conditional Styling

Use `classnames` (imported as `cn`) for conditional classes:

**Pattern**:
```typescript
import cn from 'classnames';

const className = cn(
  'base-class-1 base-class-2',
  {
    'conditional-class': condition,
    'another-class': anotherCondition,
  }
);
```

**Example from codebase**:
```21:32:full-auth/components/common/NavLink.tsx
	const className = cn(
		rest.className,
		'text-white rounded-md px-3 py-2 font-medium',
		{
			'bg-gray-900': isSelected,
			'text-gray-300 hover:bg-gray-700 hover:text-white':
				!isSelected && !isBanner,
			'block text-base': isMobile,
			'text-sm': !isMobile,
			'text-gray-300': isBanner,
		}
	);
```

### 3.5 Typography Scale

- **Page Title**: `text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl`
- **Section Heading**: `text-3xl font-bold tracking-tight text-gray-900`
- **Page Heading**: `text-2xl font-bold leading-9 tracking-tight text-gray-900`
- **Body Text**: `text-lg leading-8 text-gray-600`
- **Small Text**: `text-sm text-gray-500`
- **Label Text**: `text-sm font-medium leading-6 text-gray-900`

---

## 4. TypeScript Standards

### 4.1 Interface Definitions

**Rules**:
- Define `Props` interface for all component props
- Use descriptive prop names
- Mark optional props with `?`
- Use `React.ReactNode` for children
- Use specific types instead of `any` when possible

**Example**:
```4:15:full-auth/components/forms/Input.tsx
interface Props {
	labelId: string;
	type: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	value: string;
	children: React.ReactNode;
	link?: {
		linkText: string;
		linkUrl: string;
	};
	required?: boolean;
}
```

### 4.2 Type Safety Best Practices

- **Explicit types**: Use explicit types for function parameters
- **Type inference**: Use TypeScript's type inference for return types when clear
- **Config interfaces**: Define interfaces for config objects

**Example - Config Interface**:
```5:15:full-auth/components/forms/Form.tsx
interface Config {
	labelText: string;
	labelId: string;
	type: string;
	value: string;
	link?: {
		linkText: string;
		linkUrl: string;
	};
	required?: boolean;
}
```

### 4.3 Spread Props Pattern

Use spread props (`...rest`) for pass-through attributes:

**Example**:
```9:22:full-auth/components/common/SocialButton.tsx
export default function SocialButton({ provider, children, ...rest }: Props) {
	const className = cn(
		'flex-1 text-white rounded-md px-3 mt-3 py-2 font-medium',
		{
			'bg-red-500 hover:bg-red-400': provider === 'google',
			'bg-blue-500 hover:bg-blue-400': provider === 'facebook',
		}
	);

	return (
		<button className={className} {...rest}>
			<span className='flex justify-start items-center'>{children}</span>
		</button>
	);
}
```

---

## 5. Form Component Patterns

### 5.1 Form Configuration Pattern

Forms use a **config array pattern** for declarative form definition:

**Config Structure**:
```typescript
interface FormConfig {
  labelText: string;      // Display label
  labelId: string;        // HTML id and name attribute
  type: string;           // Input type (text, email, password, etc.)
  value: string;          // Current form value
  required?: boolean;     // Required field indicator
  link?: {                // Optional link (e.g., "Forgot password?")
    linkText: string;
    linkUrl: string;
  };
}
```

**Example from LoginForm**:
```9:28:full-auth/components/forms/LoginForm.tsx
	const config = [
		{
			labelText: 'Email address',
			labelId: 'email',
			type: 'email',
			value: email,
			required: true,
		},
		{
			labelText: 'Password',
			labelId: 'password',
			type: 'password',
			value: password,
			link: {
				linkText: 'Forgot password?',
				linkUrl: '/password-reset',
			},
			required: true,
		},
	];
```

### 5.2 Form Component Architecture

**Three-Layer Pattern**:

1. **Container Component** (e.g., `LoginForm`, `RegisterForm`)
   - Uses custom hook for business logic
   - Defines config array
   - Renders base `Form` component

2. **Base Form Component** (`Form`)
   - Accepts config array
   - Maps config to `Input` components
   - Handles form submission

3. **Input Component** (`Input`)
   - Renders label, input field, and optional link
   - Handles individual input rendering

**Example - Container Component**:
```6:38:full-auth/components/forms/LoginForm.tsx
export default function LoginForm() {
	const { email, password, isLoading, onChange, onSubmit } = useLogin();

	const config = [
		{
			labelText: 'Email address',
			labelId: 'email',
			type: 'email',
			value: email,
			required: true,
		},
		{
			labelText: 'Password',
			labelId: 'password',
			type: 'password',
			value: password,
			link: {
				linkText: 'Forgot password?',
				linkUrl: '/password-reset',
			},
			required: true,
		},
	];

	return (
		<Form
			config={config}
			isLoading={isLoading}
			btnText='Sign in'
			onChange={onChange}
			onSubmit={onSubmit}
		/>
	);
}
```

### 5.3 Form State Management

**Custom Hook Pattern**:
- Form state managed in custom hooks (e.g., `use-login.ts`, `use-register.ts`)
- Hook returns: form values, `isLoading`, `onChange`, `onSubmit`
- Redux mutations handle API calls

**Hook Structure**:
```typescript
export default function useFormName() {
  const [formData, setFormData] = useState({ /* initial state */ });
  const [mutation, { isLoading }] = useMutation();
  
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Update form state
  };
  
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Handle submission
  };
  
  return {
    ...formData,
    isLoading,
    onChange,
    onSubmit,
  };
}
```

**Example**:
```8:48:full-auth/hooks/use-login.ts
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

		login({ email, password })
			.unwrap()
			.then(() => {
				dispatch(setAuth());
				toast.success('Logged in');
				router.push('/dashboard');
			})
			.catch(() => {
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
```

---

## 6. Layout & Page Structure

### 6.1 Root Layout Pattern

The root layout (`app/layout.tsx`) provides:
- Global providers (Redux)
- Navigation (`Navbar`)
- Footer (`Footer`)
- Consistent container wrapper

**Structure**:
```20:34:full-auth/app/layout.tsx
	return (
		<html lang='en'>
			<body className={inter.className}>
				<Provider>
					<Setup />
					<Navbar />
					<div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-8'>
						{children}
					</div>
					<Footer />
				</Provider>
			</body>
		</html>
	);
```

### 6.2 Page Component Structure

**Server Components by Default**:
- Next.js App Router uses server components by default
- Use `'use client'` directive only when needed:
  - Using React hooks (`useState`, `useEffect`, etc.)
  - Event handlers (`onClick`, `onChange`, etc.)
  - Browser APIs
  - Context providers

**Page Template**:
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | App Name',
  description: 'Page description',
};

export default function Page() {
  return (
    // Page content
  );
}
```

**Example - Server Component**:
```1:41:full-auth/app/auth/login/page.tsx
import Link from 'next/link';
import { LoginForm } from '@/components/forms';
import { SocialButtons } from '@/components/common';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Full Auth | Login',
	description: 'Full Auth login page',
};

export default function Page() {
	return (
		<div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
			<div className='sm:mx-auto sm:w-full sm:max-w-sm'>
				<img
					className='mx-auto h-10 w-auto'
					src='https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600'
					alt='Full Auth'
				/>
				<h2 className='mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>
					Sign in to your account
				</h2>
			</div>

			<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
				<LoginForm />
				<SocialButtons />

				<p className='mt-10 text-center text-sm text-gray-500'>
					Don&apos;t have an account?{' '}
					<Link
						href='/auth/register'
						className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'
					>
						Register here
					</Link>
				</p>
			</div>
		</div>
	);
}
```

**Example - Client Component**:
```1:46:full-auth/app/dashboard/page.tsx
'use client';

import { useRetrieveUserQuery } from '@/redux/features/authApiSlice';
import { List, Spinner } from '@/components/common';

export default function Page() {
	const { data: user, isLoading, isFetching } = useRetrieveUserQuery();

	const config = [
		{
			label: 'First Name',
			value: user?.first_name,
		},
		{
			label: 'Last Name',
			value: user?.last_name,
		},
		{
			label: 'Email',
			value: user?.email,
		},
	];

	if (isLoading || isFetching) {
		return (
			<div className='flex justify-center my-8'>
				<Spinner lg />
			</div>
		);
	}

	return (
		<>
			<header className='bg-white shadow'>
				<div className='mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'>
					<h1 className='text-3xl font-bold tracking-tight text-gray-900'>
						Dashboard
					</h1>
				</div>
			</header>
			<main className='mx-auto max-w-7xl py-6 my-8 sm:px-6 lg:px-8'>
				<List config={config} />
			</main>
		</>
	);
}
```

### 6.3 Protected Routes

Use layout-level protection for route groups:

**Example**:
```1:9:full-auth/app/dashboard/layout.tsx
import { RequireAuth } from '@/components/utils';

interface Props {
	children: React.ReactNode;
}

export default function Layout({ children }: Props) {
	return <RequireAuth>{children}</RequireAuth>;
}
```

### 6.4 Loading States

**Pattern**: Always show loading state during async operations

**Spinner Component**:
- Size variants: `sm`, `md`, `lg`
- Usage: `<Spinner sm />`, `<Spinner md />`, `<Spinner lg />`

**Loading Pattern**:
```typescript
if (isLoading || isFetching) {
  return (
    <div className='flex justify-center my-8'>
      <Spinner lg />
    </div>
  );
}
```

**Example**:
```24:30:full-auth/app/dashboard/page.tsx
	if (isLoading || isFetching) {
		return (
			<div className='flex justify-center my-8'>
				<Spinner lg />
			</div>
		);
	}
```

---

## 7. Naming Conventions

### 7.1 Files & Folders

| Type | Convention | Example |
|------|-----------|---------|
| Component files | PascalCase | `LoginForm.tsx`, `Navbar.tsx` |
| Hook files | kebab-case | `use-login.ts`, `use-register.ts` |
| Page files | `page.tsx` | `app/auth/login/page.tsx` |
| Layout files | `layout.tsx` | `app/dashboard/layout.tsx` |
| Folders | kebab-case | `password-reset/`, `auth/` |
| Barrel exports | `index.ts` | `components/common/index.ts` |

### 7.2 Code Elements

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `LoginForm`, `SocialButton` |
| Functions/Hooks | camelCase | `useLogin`, `handleLogout` |
| Variables | camelCase | `isLoading`, `formData` |
| Interfaces/Types | PascalCase | `Props`, `Config` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL` (if used) |

### 7.3 Import Conventions

**Order**:
1. External libraries
2. Next.js imports
3. Internal components (using `@/` alias)
4. Hooks
5. Utilities
6. Types/interfaces

**Example**:
```typescript
import { useState } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/forms';
import { useLogin } from '@/hooks';
import type { Metadata } from 'next';
```

---

## 8. Component Patterns

### 8.1 Reusable Component Pattern

**Key Principles**:
- Accept `children` prop for flexibility
- Use spread props (`...rest`) for pass-through attributes
- Conditional rendering based on props
- Single responsibility

**Example**:
```13:46:full-auth/components/common/NavLink.tsx
export default function NavLink({
	isSelected,
	isMobile,
	isBanner,
	href,
	children,
	...rest
}: Props) {
	const className = cn(
		rest.className,
		'text-white rounded-md px-3 py-2 font-medium',
		{
			'bg-gray-900': isSelected,
			'text-gray-300 hover:bg-gray-700 hover:text-white':
				!isSelected && !isBanner,
			'block text-base': isMobile,
			'text-sm': !isMobile,
			'text-gray-300': isBanner,
		}
	);

	if (!href) {
		return (
			<span className={className} role='button' onClick={rest.onClick}>
				{children}
			</span>
		);
	}

	return (
		<Link className={className} href={href}>
			{children}
		</Link>
	);
}
```

### 8.2 Loading & Error States

**Loading States**:
- Always handle loading states
- Show `Spinner` during async operations
- Disable interactive elements during loading

**Error Handling**:
- Use toast notifications for user feedback
- Handle errors in mutation `.catch()` blocks
- Show user-friendly error messages

**Example**:
```26:38:full-auth/hooks/use-login.ts
	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		login({ email, password })
			.unwrap()
			.then(() => {
				dispatch(setAuth());
				toast.success('Logged in');
				router.push('/dashboard');
			})
			.catch(() => {
				toast.error('Failed to log in');
			});
	};
```

### 8.3 Accessibility Standards

**Semantic HTML**:
- Use semantic elements: `<nav>`, `<main>`, `<footer>`, `<header>`
- Proper heading hierarchy (`h1`, `h2`, etc.)

**ARIA Attributes**:
- `aria-hidden='true'` for decorative icons
- `role` attributes where needed (`role='list'`, `role='button'`)
- `sr-only` class for screen reader-only text

**Example**:
```18:21:full-auth/components/common/Spinner.tsx
	return (
		<div role='status'>
			<ImSpinner3 className={className} />
			<span className='sr-only'>Loading...</span>
		</div>
	);
```

**Form Accessibility**:
- Proper `label` associations with `htmlFor` and `id`
- Required field indicators
- Error messages associated with inputs

**Example**:
```29:34:full-auth/components/forms/Input.tsx
				<label
					htmlFor={labelId}
					className='block text-sm font-medium leading-6 text-gray-900'
				>
					{children}
				</label>
```

---

## 9. State Management Patterns

### 9.1 Redux Structure

**File Organization**:
```
redux/
├── features/
│   ├── authSlice.ts        # Auth state slice
│   └── authApiSlice.ts     # RTK Query API slice
├── services/
│   └── apiSlice.ts         # Base API slice
├── hooks.ts                # Typed hooks (useAppSelector, useAppDispatch)
├── provider.tsx            # Redux Provider component
└── store.ts                # Store configuration
```

**Patterns**:
- RTK Query for API calls
- Slices for local state management
- Custom typed hooks for type safety

### 9.2 Local State Management

**Simple State**: Use `useState`
```typescript
const [formData, setFormData] = useState({ email: '', password: '' });
```

**Complex State**: Use custom hooks
- Form state in custom hooks (`use-login.ts`, `use-register.ts`)
- Reusable state logic extracted to hooks

**Example**:
```13:16:full-auth/hooks/use-login.ts
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
```

---

## 10. Best Practices for Adding Features

### 10.1 Creating New Components

**Checklist**:
1. ✅ Determine component category (common/forms/utils)
2. ✅ Create component file with TypeScript interface
3. ✅ Add to folder's `index.ts` for export
4. ✅ Use existing styling patterns
5. ✅ Follow naming conventions
6. ✅ Add accessibility attributes
7. ✅ Handle loading/error states if needed

**Quick Start Template**:
```typescript
interface Props {
  // Define props
}

export default function NewComponent({ prop1 }: Props) {
  return (
    <div className='/* use existing class patterns */'>
      {/* Component content */}
    </div>
  );
}
```

### 10.2 Creating New Pages

**Checklist**:
1. ✅ Create page in appropriate `app/` folder
2. ✅ Use server component by default
3. ✅ Add `metadata` export for SEO
4. ✅ Follow existing layout patterns
5. ✅ Use existing components where possible
6. ✅ Add `'use client'` only if needed

**Page Template**:
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | App Name',
  description: 'Page description',
};

export default function Page() {
  return (
    <div className='/* use existing container patterns */'>
      {/* Page content */}
    </div>
  );
}
```

### 10.3 Styling New Features

**Guidelines**:
- ✅ Reuse existing Tailwind class patterns
- ✅ Use established color palette
- ✅ Follow responsive breakpoint patterns (`sm:`, `lg:`)
- ✅ Avoid custom CSS unless absolutely necessary
- ✅ Use `classnames` for conditional styling

**Quick Reference**:
- Buttons: Copy primary button pattern from `Form.tsx`
- Inputs: Copy input pattern from `Input.tsx`
- Containers: Use `mx-auto max-w-7xl px-2 sm:px-6 lg:px-8`
- Links: Use `font-semibold text-indigo-600 hover:text-indigo-500`

### 10.4 Form Implementation

**Step-by-Step**:

1. **Create Custom Hook** (`hooks/use-new-form.ts`):
```typescript
export default function useNewForm() {
  const [formData, setFormData] = useState({ /* fields */ });
  const [mutation, { isLoading }] = useMutation();
  
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };
  
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation(formData)
      .unwrap()
      .then(() => {
        toast.success('Success message');
        router.push('/success-page');
      })
      .catch(() => {
        toast.error('Error message');
      });
  };
  
  return { ...formData, isLoading, onChange, onSubmit };
}
```

2. **Create Form Component** (`components/forms/NewForm.tsx`):
```typescript
'use client';

import { useNewForm } from '@/hooks';
import { Form } from '@/components/forms';

export default function NewForm() {
  const { field1, field2, isLoading, onChange, onSubmit } = useNewForm();
  
  const config = [
    {
      labelText: 'Field 1',
      labelId: 'field1',
      type: 'text',
      value: field1,
      required: true,
    },
    // ... more fields
  ];
  
  return (
    <Form
      config={config}
      isLoading={isLoading}
      btnText='Submit'
      onChange={onChange}
      onSubmit={onSubmit}
    />
  );
}
```

3. **Add to Exports** (`components/forms/index.ts`):
```typescript
export { default as NewForm } from './NewForm';
```

4. **Use in Page**:
```typescript
import { NewForm } from '@/components/forms';

export default function Page() {
  return <NewForm />;
}
```

### 10.5 Adding New Routes

**Protected Routes**:
1. Create folder in `app/` (e.g., `app/settings/`)
2. Create `layout.tsx` with `RequireAuth` wrapper
3. Create `page.tsx` for the route

**Public Routes**:
1. Create folder in `app/` (e.g., `app/about/`)
2. Create `page.tsx` directly

---

## 11. Quick Reference Tables

### 11.1 Common Tailwind Classes

| Purpose | Classes |
|---------|---------|
| Primary button | `rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600` |
| Input field | `block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6` |
| Label | `block text-sm font-medium leading-6 text-gray-900` |
| Link | `font-semibold text-indigo-600 hover:text-indigo-500` |
| Container | `mx-auto max-w-7xl px-2 sm:px-6 lg:px-8` |
| Centered box | `sm:mx-auto sm:w-full sm:max-w-sm` |
| Loading container | `flex justify-center my-8` |

### 11.2 Component Import Patterns

```typescript
// Common components
import { Navbar, Footer, Spinner } from '@/components/common';

// Form components
import { Form, Input, LoginForm } from '@/components/forms';

// Utility components
import { RequireAuth, Setup } from '@/components/utils';

// Hooks
import { useLogin, useRegister } from '@/hooks';

// Redux
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
```

### 11.3 File Structure Checklist

```
✅ Component file: PascalCase.tsx
✅ Hook file: kebab-case.ts
✅ Index file: index.ts (barrel export)
✅ Page file: page.tsx
✅ Layout file: layout.tsx
✅ Folder: kebab-case/
```

---

## 12. Common Patterns & Examples

### 12.1 Config-Driven List Component

**Usage**:
```typescript
const config = [
  { label: 'First Name', value: user?.first_name },
  { label: 'Last Name', value: user?.last_name },
];

<List config={config} />
```

### 12.2 Conditional Rendering Pattern

```typescript
{isLoading ? (
  <div className='flex justify-center my-8'>
    <Spinner lg />
  </div>
) : (
  <Content />
)}
```

### 12.3 Form with Link Pattern

```typescript
{
  labelText: 'Password',
  labelId: 'password',
  type: 'password',
  value: password,
  link: {
    linkText: 'Forgot password?',
    linkUrl: '/password-reset',
  },
  required: true,
}
```

---

## Conclusion

This document captures the established patterns and standards from the existing codebase. When adding new features:

1. **Check this document first** for existing patterns
2. **Reuse components** rather than creating new ones
3. **Follow naming conventions** consistently
4. **Use established styling patterns** from the examples
5. **Maintain consistency** with existing code

By following these standards, the team can focus on building features and improving UX rather than making design decisions.

---

**Last Updated**: Based on codebase analysis of `full-auth/` directory
**Version**: 1.0

