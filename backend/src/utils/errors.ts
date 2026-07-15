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

export function getErrorResponse(err: unknown): {
  status: number;
  response: ErrorResponse;
} {
  if (isHTTPError(err)) {
    return {
      status: err.status,
      response: { success: false, message: err.message },
    };
  } else {
    console.error(err);
    return {
      status: 500,
      response: { success: false, message: "Internal Server Error" },
    };
  }
}

export async function handlerWrapper<
  U extends Promise<{ [key: string]: unknown }> | { [key: string]: unknown },
  T = unknown,
>(
  controller: (...args: T[]) => Promise<U> | ((...args: T[]) => U),
  thisArg: unknown,
  ...args: T[]
): Promise<{ status: number; response: Awaited<U> | ErrorResponse }> {
  try {
    const response = await controller.call(thisArg, ...args);
    return { status: 200, response };
  } catch (err) {
    const { status, response } = getErrorResponse(err);
    return { status, response };
  }
}
