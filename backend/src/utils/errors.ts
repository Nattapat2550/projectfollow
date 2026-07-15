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

/**
 * Wraps controller and take care of error handling .
 *
 * @param f controller function
 * @param [thisArg=undefined] The object to be used as the current object.
 * @param args controller arguments
 */
export async function handlerWrapper<F extends (...args: any) => any>(
  f: F,
  thisArg: unknown = undefined,
  ...args: Parameters<F>
): Promise<{
  status: number;
  response: Awaited<ReturnType<F>> | ErrorResponse;
}> {
  try {
    const response = await f.call(thisArg, ...args);
    return { status: 200, response };
  } catch (err) {
    const { status, response } = getErrorResponse(err);
    return { status, response };
  }
}
