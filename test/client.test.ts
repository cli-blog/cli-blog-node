import { describe, expect, test } from "bun:test";

import { CliBlog, CliBlogError } from "../src/index.js";

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    status: init.status ?? 200,
  });

describe("@cli-blog/node", () => {
  test("sends API keys and query controls", async () => {
    const requests: Array<{ input: URL | RequestInfo; init?: RequestInit }> = [];
    const client = new CliBlog({
      apiKey: "cli_blog_pk_test",
      apiUrl: "https://api.example.com",
      fetch: async (input, init) => {
        requests.push({ init, input });
        return jsonResponse({ object: "list", data: [] });
      },
    });

    await client.posts.list({
      fields: ["summary", "content"],
      include: ["authors", "tags"],
      limit: 10,
      locale: "en-US",
    });

    const request = requests[0];
    expect(request).toBeDefined();
    expect(new Headers(request?.init?.headers).get("x-api-key")).toBe("cli_blog_pk_test");
    expect(String(request?.input)).toContain("/v1/posts?");
    expect(String(request?.input)).toContain("fields=summary");
    expect(String(request?.input)).toContain("fields=content");
    expect(String(request?.input)).toContain("include=authors");
    expect(String(request?.input)).toContain("include=tags");
    expect(String(request?.input)).toContain("limit=10");
  });

  test("maps API errors to CliBlogError", async () => {
    const client = new CliBlog({
      apiKey: "cli_blog_sk_test",
      fetch: async () =>
        jsonResponse(
          {
            error: {
              code: "forbidden",
              field: "x-api-key",
              message: "Private key required",
            },
          },
          { status: 403, headers: { "x-request-id": "req_123" } },
        ),
    });

    await expect(client.posts.create({ title: "Hello" })).rejects.toMatchObject({
      code: "forbidden",
      field: "x-api-key",
      message: "Private key required",
      requestId: "req_123",
      status: 403,
    } satisfies Partial<CliBlogError>);
  });

  test("uploads media with native FormData", async () => {
    const bodies: unknown[] = [];
    const client = new CliBlog({
      apiKey: "cli_blog_sk_test",
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
      apiKey: "cli_blog_sk_test",
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
    expect(new Headers(requests[4]?.init?.headers).get("user-agent")).toBe("@cli-blog/node/0.1.2");
    expect(String(requests[5]?.input)).toContain("/v1/feed?");
  });

  test("keeps SDK route coverage aligned with public OpenAPI paths", async () => {
    const client = new CliBlog({ apiKey: "cli_blog_pk_test" });
    const publicPaths = (await Bun.file(new URL("./public-openapi-paths.json", import.meta.url)).json()) as string[];
    const sdkPaths = [
      "/v1/authors",
      "/v1/authors/{id}",
      "/v1/categories",
      "/v1/categories/{id}",
      "/v1/feed",
      "/v1/locales",
      "/v1/media",
      "/v1/media/{id}",
      "/v1/posts",
      "/v1/posts/{id}",
      "/v1/posts/{id}/revisions",
      "/v1/posts/{id}/revisions/{revisionId}",
      "/v1/posts/slug-redirects/{slug}",
      "/v1/sitemap",
      "/v1/tags",
      "/v1/tags/{id}",
    ].sort();

    expect("settings" in (client as object)).toBe(false);
    expect(publicPaths).not.toContain("/v1/settings");
    expect(publicPaths.sort()).toEqual(sdkPaths);
  });
});
