import { type ErrorResponse, getErrorResponse } from "@/errors";

export async function handlerWrapper<T>(
	controller: (...args: unknown[]) => Promise<T>
): Promise<{ status: number; response: Awaited<T> | ErrorResponse }> {
	try {
		const response = await controller();
		return { status: 200, response };
	} catch (err) {
		const { status, response } = getErrorResponse(err);
		return { status, response };
	}
}
