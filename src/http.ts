import { CliBlogError, errorFromResponse } from "./error.js";
import type { ListResponse, RequestOptions } from "./types.js";
import { CLI_BLOG_NODE_VERSION } from "./version.js";

type QueryValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

export type ClientConfig = {
  apiKey: string;
  apiUrl?: string;
  fetch?: typeof fetch;
};

export type RequestConfig = RequestOptions & {
  body?: unknown;
  formData?: FormData;
  query?: Record<string, QueryValue>;
};

const DEFAULT_API_URL = "https://api.cli-blog.com";
const MAX_RETRY_DELAY_MS = 30_000;

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const retryStatuses = new Set([408, 425, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeApiUrl = (apiUrl?: string) => {
  const value = apiUrl ?? DEFAULT_API_URL;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Unsupported protocol");
    return url.toString().replace(/\/$/, "");
  } catch (cause) {
    throw new CliBlogError("Cli Blog API URL must be a valid HTTP or HTTPS URL", {
      cause,
      code: "invalid_api_url",
    });
  }
};

const appendQuery = (url: URL, query?: Record<string, QueryValue>) => {
  if (!query) return;

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
};

const parseRetryAfter = (response: Response) => {
  const value = response.headers.get("retry-after");
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.min(MAX_RETRY_DELAY_MS, Math.max(0, seconds * 1000));
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.min(MAX_RETRY_DELAY_MS, Math.max(0, date - Date.now())) : null;
};

const shouldRetryResponse = (response: Response) =>
  retryStatuses.has(response.status) || (response.status === 429 && response.headers.has("retry-after"));

export class HttpClient {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(config: ClientConfig) {
    if (!config.apiKey) {
      throw new CliBlogError("Cli Blog API key is required", { code: "missing_api_key" });
    }

    this.apiKey = config.apiKey;
    this.apiUrl = normalizeApiUrl(config.apiUrl);
    this.fetcher = config.fetch ?? fetch;
  }

  async request<T>(method: string, path: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.send(method, path, config);
    if (response.status === 204) return undefined as T;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json") || contentType.includes("+json")) {
      return (await response.json()) as T;
    }
    return (await response.text()) as T;
  }

  async text(method: string, path: string, config: RequestConfig = {}): Promise<string> {
    const response = await this.send(method, path, config);
    return response.text();
  }

  async list<T>(path: string, config: RequestConfig = {}): Promise<ListResponse<T>> {
    return this.request<ListResponse<T>>("GET", path, config);
  }

  async *paginate<T>(path: string, config: RequestConfig = {}): AsyncGenerator<T, void, unknown> {
    if (config.query?.page !== undefined || config.query?.per_page !== undefined) {
      throw new CliBlogError("Cursor pagination helpers do not accept page or per_page. Use list() for numbered pages.", {
        code: "invalid_pagination",
        param: config.query.page !== undefined ? "page" : "per_page",
      });
    }

    let after = typeof config.query?.after === "string" ? config.query.after : undefined;

    do {
      const page = await this.list<T>(path, {
        ...config,
        query: {
          ...config.query,
          after,
        },
      });

      for (const item of page.data) yield item;
      after = page.next_cursor ?? undefined;
      if (!page.has_more) break;
    } while (after);
  }

  private async send(method: string, path: string, config: RequestConfig): Promise<Response> {
    const url = new URL(`${this.apiUrl}${path}`);
    appendQuery(url, config.query);

    const headers = new Headers({
      "user-agent": `@cli-blog/node/${CLI_BLOG_NODE_VERSION}`,
      "x-api-key": config.apiKey ?? this.apiKey,
    });

    let body: BodyInit | undefined;
    if (config.formData) {
      body = config.formData;
    } else if (config.body !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(config.body);
    }

    const maxAttempts = safeMethods.has(method) ? 3 : 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const init: RequestInit = {
          headers,
          method,
        };
        if (body !== undefined) init.body = body;
        if (config.signal !== undefined) init.signal = config.signal;

        const response = await this.fetcher(url, init);

        if (response.ok) return response;

        if (attempt < maxAttempts && shouldRetryResponse(response)) {
          await sleep(parseRetryAfter(response) ?? 100 * attempt);
          continue;
        }

        throw await errorFromResponse(response);
      } catch (error) {
        lastError = error;
        if (error instanceof CliBlogError) throw error;
        if (config.signal?.aborted) {
          throw new CliBlogError("Cli Blog API request was aborted", {
            cause: error,
            code: "request_aborted",
          });
        }
        if (attempt >= maxAttempts) {
          throw new CliBlogError("Cli Blog API request failed", {
            cause: error,
            code: "request_failed",
          });
        }
        await sleep(100 * attempt);
      }
    }

    throw new CliBlogError("Cli Blog API request failed", {
      cause: lastError,
      code: "request_failed",
    });
  }
}

export const csv = (value: string | string[] | undefined) => (Array.isArray(value) ? value.join(",") : value);
