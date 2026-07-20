import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function fetchWrapper<T>(
	input: string | URL | Request,
	init?: RequestInit,
	searchParams?: Record<string, string | undefined | null>
): Promise<T | ErrorResponse> {
	try {
		let url = `${backendUrl}${input}`;

		if (searchParams) {
			const params = new URLSearchParams();
			for (const [key, value] of Object.entries(searchParams)) {
				if (value) params.append(key, value);
			}
			url = `${url}?${params.toString()}`;
		}

		const response = await fetch(url, init);
		return (await response.json()) as T;
	} catch (error) {
		console.error(error);
		return { success: false, message: "API Fetch Failed" };
	}
}

export function withAuthHeader(token: string, init?: RequestInit): RequestInit {
	if (!init) init = {};

	init.headers = {
		...init.headers,
		Authorization: `Bearer ${token}`,
	};

	return init;
}

export function withJSONBody(
	payload: Record<string, unknown>,
	method: string = "POST",
	init: RequestInit = {}
): RequestInit {
	init.headers = {
		...init.headers,
		"Content-Type": "application/json",
	};
	init.method = method;
	init.body = JSON.stringify(payload);

	return init;
}

export function withFormDataBody(
	payload: Record<string, unknown>,
	method: string = "POST",
	init: RequestInit = {}
): RequestInit {
	init.method = method;

	const formData = new FormData();
	for (const [key, value] of Object.entries(payload)) {
		formData.append(key, value instanceof File ? value : String(value));
	}
	init.body = formData;

	return init;
}
