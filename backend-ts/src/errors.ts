export class HTTPError extends Error {
	public status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

export function error(status: number, message?: string): never {
	throw new HTTPError(status, message ?? "");
}

export function isHTTPError(err: unknown): err is HTTPError {
	return err instanceof HTTPError;
}

export type ErrorResponse = {
	status: false;
	message: string;
};

export function getErrorResponse(err: unknown): {
	status: number;
	response: ErrorResponse;
} {
	if (isHTTPError(err)) {
		return {
			status: err.status,
			response: { status: false, message: err.message },
		};
	} else {
		console.error(err);
		return {
			status: 500,
			response: { status: false, message: "Internal Server Error" },
		};
	}
}
