import { describe, expect, test } from "bun:test";

import { CliBlog, CliBlogError } from "../src/index.js";
import { SDK_PUBLIC_OPERATIONS } from "./sdk-operations.js";

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    status: init.status ?? 200,
  });

describe("@cli-blog/node", () => {
  test("sends API keys and query controls", async () => {
    const requests: Array<{ input: URL | RequestInfo; init?: RequestInit }> = [];
    const client = new CliBlog({
      apiKey: "<public-api-key>",
      apiUrl: "https://api.example.com",
      fetch: async (input, init) => {
        requests.push({ init, input });
        return jsonResponse({ object: "list", data: [] });
      },
    });

    await client.posts.list({
      author_match: "all",
      exclude_category_slug: ["internal", "private"],
      fields: ["summary", "content"],
      include: ["authors", "tags"],
      limit: 10,
      locale: "en-US",
    });

    const request = requests[0];
    expect(request).toBeDefined();
    expect(new Headers(request?.init?.headers).get("x-api-key")).toBe("<public-api-key>");
    expect(String(request?.input)).toContain("/v1/posts?");
    expect(String(request?.input)).toContain("fields=summary");
    expect(String(request?.input)).toContain("fields=content");
    expect(String(request?.input)).toContain("include=authors");
    expect(String(request?.input)).toContain("include=tags");
    expect(String(request?.input)).toContain("limit=10");
    expect(String(request?.input)).toContain("author_match=all");
    expect(String(request?.input)).toContain("exclude_category_slug=internal%2Cprivate");
  });

  test("supports numbered pagination parameters and metadata", async () => {
    const requests: Array<{ input: URL | RequestInfo; init?: RequestInit }> = [];
    const client = new CliBlog({
      apiKey: "<public-api-key>",
      apiUrl: "https://api.example.com",
      fetch: async (input, init) => {
        requests.push({ init, input });
        return jsonResponse({
          data: [],
          has_more: true,
          next_cursor: "cursor_next",
          object: "list",
          page: 2,
          per_page: 25,
          total_items: 120,
          total_pages: 5,
        });
      },
    });

    const page = await client.posts.list({ fields: ["summary"], page: 2, per_page: 25 });

    expect(page).toMatchObject({
      has_more: true,
      next_cursor: "cursor_next",
      page: 2,
      per_page: 25,
      total_items: 120,
      total_pages: 5,
    });
    expect(String(requests[0]?.input)).toContain("page=2");
    expect(String(requests[0]?.input)).toContain("per_page=25");
    expect(String(requests[0]?.input)).not.toContain("limit=");
    expect(String(requests[0]?.input)).not.toContain("after=");
  });

  test("maps API errors to CliBlogError", async () => {
    const client = new CliBlog({
      apiKey: "<private-api-key>",
      fetch: async () =>
        jsonResponse(
          {
            error: {
              code: "forbidden",
              param: "x-api-key",
              message: "Private key required",
            },
          },
          { status: 403, headers: { "x-request-id": "req_123" } },
        ),
    });

    await expect(client.posts.create({ title: "Hello" })).rejects.toMatchObject({
      code: "forbidden",
      field: "x-api-key",
      param: "x-api-key",
      message: "Private key required",
      requestId: "req_123",
      status: 403,
    } satisfies Partial<CliBlogError>);
  });

  test("uploads media with native FormData", async () => {
    const bodies: unknown[] = [];
    const client = new CliBlog({
      apiKey: "<private-api-key>",
      fetch: async (_request, init) => {
        bodies.push(init?.body);
        return jsonResponse({
          id: "media_123",
          object: "media_asset",
          organization_id: "org_123",
          url: "https://cdn.example.com/image.png",
          original_filename: "image.png",
          alt_text: "Image",
          caption: null,
          mime_type: "image/png",
          width: null,
          height: null,
          size_bytes: 4,
          metadata: {},
          created_at: "2026-05-27T00:00:00.000Z",
          updated_at: "2026-05-27T00:00:00.000Z",
        });
      },
    });

    await client.media.upload({
      alt_text: "Image",
      file: new Blob(["test"], { type: "image/png" }),
      filename: "image.png",
      metadata: { source: "test" },
    });

    expect(bodies[0]).toBeInstanceOf(FormData);
    const formData = bodies[0] as FormData;
    expect(formData.get("alt_text")).toBe("Image");
    expect(formData.get("metadata")).toBe(JSON.stringify({ source: "test" }));
  });

  test("supports revisions, slug redirects, sitemap/feed XML, and final author avatar fields", async () => {
    const requests: Array<{ input: URL | RequestInfo; init?: RequestInit }> = [];
    const client = new CliBlog({
      apiKey: "<private-api-key>",
      apiUrl: "https://api.example.com",
      fetch: async (input, init) => {
        requests.push({ init, input });
        const path = String(input);
        if (path.includes("/v1/sitemap")) {
          return new Response("<urlset></urlset>", {
            headers: { "content-type": "application/xml" },
          });
        }
        if (path.includes("/v1/feed")) {
          return new Response("<rss></rss>", {
            headers: { "content-type": "application/rss+xml" },
          });
        }
        if (path.includes("/revisions/rev_123")) {
          return jsonResponse({
            body_markdown: "# Snapshot",
            created_at: "2026-05-27T00:00:00.000Z",
            id: "rev_123",
            object: "post_revision",
            parent_post_id: "post_123",
            title: "Snapshot",
            updated_at: "2026-05-27T00:00:00.000Z",
            version: 2,
          });
        }
        if (path.includes("/revisions")) {
          return jsonResponse({
            data: [],
            object: "list",
          });
        }
        if (path.includes("/slug-redirects")) {
          return jsonResponse({
            content_type: "blog_post",
            from_slug: "old-slug",
            locale: "en-US",
            object: "slug_redirect",
            post_id: "post_123",
            status_code: 301,
            to_slug: "new-slug",
          });
        }
        return jsonResponse({
          avatar_media_id: "media_123",
          avatar_url: "https://cdn.example.com/avatar.png",
          bio: null,
          created_at: "2026-05-27T00:00:00.000Z",
          id: "author_123",
          metadata: {},
          object: "author",
          organization_id: "org_123",
          public_name: "Ada Lovelace",
          slug: "ada-lovelace",
          updated_at: "2026-05-27T00:00:00.000Z",
          website_url: null,
        });
      },
    });

    await client.authors.create({ avatar_media_id: "media_123", public_name: "Ada Lovelace" });
    await client.posts.revisions.list("post_123", { limit: 10, locale: "en-US" });
    await client.posts.revisions.get("post_123", "rev_123", { locale: "en-US" });
    await client.posts.slugRedirects.get("old-slug", { locale: "en-US" });
    const xml = await client.sitemap.get({ locale: "en-US", limit: 50 });
    const feedXml = await client.feed.get({ locale: "en-US", limit: 20 });

    expect(xml).toBe("<urlset></urlset>");
    expect(feedXml).toBe("<rss></rss>");
    expect(String(requests[0]?.input)).toBe("https://api.example.com/v1/authors");
    expect(await new Response(requests[0]?.init?.body).json()).toMatchObject({
      avatar_media_id: "media_123",
      public_name: "Ada Lovelace",
    });
    expect(String(requests[1]?.input)).toContain("/v1/posts/post_123/revisions?");
    expect(String(requests[2]?.input)).toContain("/v1/posts/post_123/revisions/rev_123?");
    expect(String(requests[3]?.input)).toContain("/v1/posts/slug-redirects/old-slug?");
    expect(String(requests[4]?.input)).toContain("/v1/sitemap?");
    expect(new Headers(requests[4]?.init?.headers).get("user-agent")).toBe("@cli-blog/node/0.2.0");
    expect(String(requests[5]?.input)).toContain("/v1/feed?");
  });

  test("keeps SDK operation coverage aligned with the generated public OpenAPI contract", async () => {
    const client = new CliBlog({ apiKey: "<public-api-key>" });
    const contract = (await Bun.file(new URL("./openapi-contract.json", import.meta.url)).json()) as {
      operations: Array<{ method: string; parameters: Array<{ in: string; name: string }>; path: string }>;
    };
    const publicOperations = contract.operations.map(({ method, path }) => `${method} ${path}`).sort();
    const postList = contract.operations.find(({ method, path }) => method === "GET" && path === "/v1/posts");

    expect("settings" in (client as object)).toBe(false);
    expect(publicOperations).not.toContain("GET /v1/settings");
    expect(publicOperations).toEqual([...SDK_PUBLIC_OPERATIONS].sort());
    expect(postList?.parameters.filter(({ in: location }) => location === "query").map(({ name }) => name)).toEqual(
      expect.arrayContaining(["author_match", "exclude_author_id", "category_match", "exclude_tag_slug", "page", "per_page"]),
    );
  });

  test("keeps dual-mode pagination contract coverage across public list endpoints", async () => {
    const contract = (await Bun.file(new URL("./openapi-contract.json", import.meta.url)).json()) as {
      operations: Array<{
        method: string;
        parameters: Array<{ in: string; name: string }>;
        path: string;
        responses: Array<{ content: Array<{ content_type: string; properties: string[]; required: string[] }>; status: string }>;
      }>;
    };
    const listPaths = ["/v1/posts", "/v1/posts/{id}/revisions", "/v1/authors", "/v1/media", "/v1/categories", "/v1/tags"];

    for (const path of listPaths) {
      const operation = contract.operations.find((item) => item.method === "GET" && item.path === path);
      const queryParams = operation?.parameters.filter(({ in: location }) => location === "query").map(({ name }) => name);
      const jsonResponseSchema = operation?.responses
        .find(({ status }) => status === "200")
        ?.content.find(({ content_type }) => content_type === "application/json");

      expect(queryParams).toEqual(expect.arrayContaining(["after", "limit", "page", "per_page"]));
      expect(jsonResponseSchema?.required).toEqual(["data", "has_more", "next_cursor", "object"]);
      expect(jsonResponseSchema?.properties).toEqual(
        expect.arrayContaining(["data", "has_more", "next_cursor", "object", "page", "per_page", "total_items", "total_pages"]),
      );
    }
  });

  test("rejects numbered pagination controls in cursor iteration helpers", async () => {
    const client = new CliBlog({
      apiKey: "<public-api-key>",
      fetch: async () => jsonResponse({ data: [], has_more: false, next_cursor: null, object: "list" }),
    });

    const iterator = client.posts.paginate({ page: 1 } as never);
    await expect(iterator.next()).rejects.toMatchObject({
      code: "invalid_pagination",
      param: "page",
    });
  });

  test("does not retry conflicts or hard plan limits", async () => {
    for (const status of [409, 429]) {
      let attempts = 0;
      const client = new CliBlog({
        apiKey: "<public-api-key>",
        fetch: async () => {
          attempts += 1;
          return jsonResponse({ error: { code: "limit", message: "Stop" } }, { status });
        },
      });

      await expect(client.posts.list()).rejects.toBeInstanceOf(CliBlogError);
      expect(attempts).toBe(1);
    }
  });

  test("wraps exhausted network failures and invalid API URLs", async () => {
    let attempts = 0;
    const client = new CliBlog({
      apiKey: "<public-api-key>",
      fetch: async () => {
        attempts += 1;
        throw new TypeError("offline");
      },
    });

    await expect(client.posts.list()).rejects.toMatchObject({ code: "request_failed", name: "CliBlogError" });
    expect(attempts).toBe(3);
    expect(() => new CliBlog({ apiKey: "<public-api-key>", apiUrl: "not-a-url" })).toThrow(CliBlogError);
  });

  test("keeps the package and user-agent versions synchronized", async () => {
    const packageJson = (await Bun.file(new URL("../package.json", import.meta.url)).json()) as { version: string };
    expect(packageJson.version).toBe("0.2.0");
  });
});
