import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const backendUrl =
	process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function fetchWrapper<T>(
	input: string | URL | Request,
	init?: RequestInit
): Promise<T | ErrorResponse> {
	try {
		const response = await fetch(`${backendUrl}${input}`, init);
		return (await response.json()) as T;
	} catch (error) {
		console.error(error);
		return { success: false, message: "API Fetch Failed" };
	}
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

export function withAuthHeader(token: string, init?: RequestInit): RequestInit {
	if (!init) init = {};

	init.headers = {
		...init.headers,
		Authorization: `Bearer ${token}`,
	};

	return init;
}
