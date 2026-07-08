import type { ErrorBody } from "./types.js";

export type CliBlogErrorOptions = {
  status?: number | undefined;
  code?: string | undefined;
  param?: string | undefined;
  /** @deprecated Use `param`. */
  field?: string | undefined;
  requestId?: string | undefined;
  response?: Response | undefined;
  cause?: unknown;
};

export class CliBlogError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly param: string | undefined;
  /** @deprecated Use `param`. */
  readonly field: string | undefined;
  readonly requestId: string | undefined;
  readonly response: Response | undefined;

  constructor(message: string, options: CliBlogErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "CliBlogError";
    this.status = options.status;
    this.code = options.code;
    this.param = options.param ?? options.field;
    this.field = this.param;
    this.requestId = options.requestId;
    this.response = options.response;
  }
}

export const errorFromResponse = async (response: Response): Promise<CliBlogError> => {
  const requestId = response.headers.get("x-request-id") ?? undefined;
  const text = await response.text();
  let body: ErrorBody | undefined;

  if (text) {
    try {
      body = JSON.parse(text) as ErrorBody;
    } catch {
      return new CliBlogError(text, {
        requestId,
        response,
        status: response.status,
      });
    }
  }

  const detail = body?.error ?? body;

  return new CliBlogError(detail?.message ?? `Cli Blog API request failed with ${response.status}`, {
    code: detail?.code,
    param: detail?.param ?? detail?.field,
    requestId,
    response,
    status: response.status,
  });
};
