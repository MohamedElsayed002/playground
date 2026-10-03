export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFailure(error: string): ActionResult<never> {
  return { ok: false, error };
}

/** Turn a safe server-action failure into a client-side error for React Query/UI handling. */
export function unwrapActionResult<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export function getApiErrorMessage(error: unknown, fallback: string, status?: number): string {
  if (status !== undefined && status >= 500) return fallback;
  if (typeof error === "string" && error.trim()) return error;
  if (typeof error !== "object" || error === null) return fallback;

  const body = error as {
    detail?: unknown;
    message?: unknown;
    errors?: Array<{ msg?: unknown }>;
  };

  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    const messages = body.detail
      .map((item) => (typeof item === "object" && item !== null ? item.msg : undefined))
      .filter((message): message is string => typeof message === "string");
    if (messages.length) return messages.join(". ");
  }
  if (typeof body.message === "string" && body.message !== "Error") return body.message;
  const validationMessage = body.errors?.find(
    (item): item is { msg: string } => typeof item.msg === "string",
  )?.msg;
  return validationMessage ?? fallback;
}

export function requireApiData<T>(
  result: { data?: T; error?: unknown; response?: Response },
  fallback: string,
): T {
  if (result.error) {
    throw new Error(getApiErrorMessage(result.error, fallback, result.response?.status));
  }
  if (result.data === undefined) throw new Error(fallback);
  return result.data;
}

export async function requestApiData<T>(
  request: () => Promise<{ data?: T; error?: unknown; response?: Response }>,
  fallback: string,
): Promise<T> {
  let result: { data?: T; error?: unknown; response?: Response };
  try {
    result = await request();
  } catch {
    throw new Error(fallback);
  }

  return requireApiData(result, fallback);
}

export function getApiErrorStatus(
  result: { response?: Response },
  fallback = 502,
): number {
  const status = result.response?.status;
  return status && status >= 400 && status <= 599 ? status : fallback;
}
