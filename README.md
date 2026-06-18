<p align="center">
  <a href="https://cli-blog.com">
    <img src="https://cli-blog.com/cli-blog-logo.png" alt="Cli Blog" width="72" height="72" />
  </a>
</p>

# @cli-blog/node

Official Node.js client for the Cli Blog API.

[Homepage](https://cli-blog.com) · [Documentation](https://cli-blog.com/docs) · [SDK Docs](https://cli-blog.com/docs/node-package) · [API Reference](https://cli-blog.com/docs/reference/endpoints) · [GitHub](https://github.com/cli-blog/cli-blog-node)

## What Is This?

`@cli-blog/node` is the first-party SDK for publishing and delivering Cli Blog content from trusted Node.js runtimes. It covers the public `/v1` content API: posts, authors, media, categories, tags, locales, sitemap XML, feed XML, revisions, and slug redirects.

The package is ESM-first, targets Node.js 20+, uses native `fetch`, `Blob`, and `FormData`, and has no runtime dependencies.

The SDK intentionally excludes dashboard-only session, billing, audit, admin, API-key helper, and organization settings routes.

## Getting Started

Install the package:

```sh
npm install @cli-blog/node
```

Create a client:

```ts
import { CliBlog } from "@cli-blog/node";

const blog = new CliBlog({
  apiKey: process.env.CLI_BLOG_API_KEY!,
});
```

Use public keys for published-content reads. Use private keys only from trusted servers, CI, CLIs, and agent runtimes. Never expose private keys in browser code.

## Reference

Client configuration:

```ts
type CliBlogConfig = {
  apiKey: string;
  fetch?: typeof fetch;
};
```

Per-request options:

```ts
type RequestOptions = {
  apiKey?: string;
  signal?: AbortSignal;
};
```

`apiKey` lets one trusted server process use a different key for a single request, such as a public read key for delivery reads. `signal` is the standard `AbortSignal`; use it to cancel a request or enforce a timeout.

```ts
const posts = await blog.posts.list(
  { status: "published" },
  {
    signal: AbortSignal.timeout(5000),
  },
);
```

Resources:

| Resource | Methods |
| --- | --- |
| `blog.posts` | `list`, `paginate`, `get`, `create`, `update`, `publish`, `schedule`, `delete` |
| `blog.posts.revisions` | `list`, `get` |
| `blog.posts.slugRedirects` | `get` |
| `blog.authors` | `list`, `get`, `create`, `update`, `delete` |
| `blog.media` | `list`, `get`, `upload`, `update`, `delete` |
| `blog.categories` | `list`, `get`, `create`, `update`, `delete` |
| `blog.tags` | `list`, `get`, `create`, `update`, `delete` |
| `blog.locales` | `list` |
| `blog.sitemap` | `get` |
| `blog.feed` | `get` |

List responses use the API cursor shape:

```ts
type ListResponse<T> = {
  object: "list";
  data: T[];
  has_more?: boolean;
  next_cursor?: string | null;
};
```

## Examples

Create and publish a San Francisco story:

```ts
import { CliBlog } from "@cli-blog/node";

const blog = new CliBlog({
  apiKey: process.env.CLI_BLOG_API_KEY!,
});

const author = await blog.authors.create({
  public_name: "Maya Chen",
  bio: "Field notes from San Francisco.",
});

const category = await blog.categories.create({
  name: "San Francisco",
  locale: "en-US",
});

const tag = await blog.tags.create({
  name: "city-notes",
  locale: "en-US",
});

const post = await blog.posts.create({
  title: "A developer's guide to San Francisco",
  body_markdown: "## Fog, hills, and neighborhoods\n\nA short guide to building and wandering in San Francisco.",
  author_profile_ids: [author.id],
  category_ids: [category.id],
  tag_ids: [tag.id],
  seo_title: "A developer's guide to San Francisco",
  seo_description: "A local story about parks, neighborhoods, and builder life in San Francisco.",
});

const published = await blog.posts.publish(post.id, {
  expected_version: post.version,
});
```

Expected shape:

```ts
console.log(published.id); // "post_..."
console.log(published.status); // "published"
console.log(published.slug); // "developers-guide-to-san-francisco"
```

Read published posts:

```ts
const posts = await blog.posts.list({
  status: "published",
  fields: ["summary", "seo"],
  include: ["authors", "media"],
  limit: 20,
  locale: "en-US",
});

for (const post of posts.data) {
  console.log(post.title, post.slug);
}
```

Expected shape:

```ts
console.log(posts.object); // "list"
console.log(posts.data[0]?.object); // "post"
console.log(posts.data[0]?.authors?.[0]?.object); // "author" when include contains "authors"
```

Paginate through posts:

```ts
for await (const post of blog.posts.paginate({ status: "published", limit: 50 })) {
  console.log(post.id);
}
```

Upload media:

```ts
import { readFile } from "node:fs/promises";

const file = new Blob([await readFile("bay-walk.png")], { type: "image/png" });

const media = await blog.media.upload({
  file,
  filename: "bay-walk.png",
  alt_text: "Morning light over San Francisco Bay",
  caption: "A local image for a San Francisco story.",
  metadata: { source: "field-notes" },
});

await blog.posts.update("developers-guide-to-san-francisco", {
  featured_media_asset_id: media.id,
});
```

Expected shape:

```ts
console.log(media.object); // "media_asset"
console.log(media.url); // generated media URL
```

Work with localization and taxonomy:

```ts
const locales = await blog.locales.list();

const spanishCategory = await blog.categories.create({
  name: "San Francisco",
  slug: "san-francisco",
  locale: "es-MX",
});

const tags = await blog.tags.list({
  locale: "es-MX",
  include: ["translations"],
});
```

Expected shape:

```ts
console.log(locales.map((locale) => locale.tag)); // ["en-US", "es-MX", ...]
console.log(spanishCategory.object); // "taxonomy_term"
console.log(tags.object); // "list"
```

Fetch revisions, redirects, sitemap, and feed:

```ts
const revisions = await blog.posts.revisions.list("developers-guide-to-san-francisco");
const revision = await blog.posts.revisions.get("developers-guide-to-san-francisco", revisions.data[0]!.id);

const redirect = await blog.posts.slugRedirects.get("old-san-francisco-guide", {
  locale: "en-US",
});

const sitemapXml = await blog.sitemap.get({ locale: "en-US", limit: 100 });
const feedXml = await blog.feed.get({ locale: "en-US", limit: 20 });
```

Expected shape:

```ts
console.log(revision.object); // "post_revision"
console.log(redirect.status_code); // 301
console.log(sitemapXml.startsWith("<?xml")); // true
console.log(feedXml.includes("<rss")); // true
```

## Errors

The SDK throws `CliBlogError` for API errors and client setup failures.

```ts
import { CliBlogError } from "@cli-blog/node";

try {
  await blog.posts.create({ title: "Draft" });
} catch (error) {
  if (error instanceof CliBlogError) {
    console.error({
      code: error.code,
      field: error.field,
      message: error.message,
      requestId: error.requestId,
      status: error.status,
    });
  }
  throw error;
}
```

`CliBlogError` fields:

| Field | Meaning |
| --- | --- |
| `message` | Human-readable error message. |
| `status` | HTTP status when the API responded. |
| `code` | API error code such as `forbidden`, `not_found`, or `validation_failed`. |
| `field` | Request field related to the error when available. |
| `requestId` | API request ID from `x-request-id`, useful for support/debugging. |
| `response` | Original `Response` object when available. |

Common cases:

| Status / code | When to expect it | What to do |
| --- | --- | --- |
| `missing_api_key` | The client was created without an API key. | Pass `apiKey` from a secret or environment variable. |
| `401` | The key is missing or invalid. | Check the key value and organization. |
| `403` / `forbidden` | The key type or scopes do not allow the action. | Use a private key for trusted writes and the right permissions. |
| `404` / `not_found` | The resource ID or locale-scoped slug does not exist. | Check the ID, slug, and locale. |
| `409` | Optimistic concurrency failed, usually from stale `expected_version`. | Fetch the latest post and retry with the current version. |
| `429` | Rate or plan limit reached. | Back off or upgrade the organization plan. |
| `5xx` | Temporary API or upstream failure. | Retry later; safe requests are retried automatically by the SDK. |

The SDK retries safe requests on transient statuses such as `408`, `409`, `425`, `429`, and `5xx`. Mutating requests are not retried automatically.

## Publishing A New Version

This repository publishes to npm from GitHub releases after `NPM_TOKEN` is configured in repository Actions secrets.

For a patch release:

```sh
npm version patch
git push origin main --follow-tags
```

Then create a GitHub release for the new tag, such as `v0.1.1`. The publish workflow verifies that the release tag matches `package.json`, runs typecheck/tests/build, and publishes with npm provenance.

If the CLI needs this new SDK version, publish `@cli-blog/node` first, then update `@cli-blog/cli` to depend on the new version.

## Security

- Never expose private API keys in browser code.
- Prefer environment variables or secret managers for private keys.
- Use public keys for published delivery reads.
- Use private keys for trusted publishing and editorial workflows.
- The SDK uses native platform APIs and does not add runtime dependencies.
