# @cli-blog/node

Official Node.js client for the Cli Blog API.

Repository: [github.com/cli-blog/cli-blog-node](https://github.com/cli-blog/cli-blog-node)

## What Is This?

`@cli-blog/node` is the first-party SDK for publishing and delivering Cli Blog content from trusted Node.js runtimes. It covers the public `/v1` content API: posts, authors, media, categories, tags, locales, sitemap XML, feed XML, revisions, and slug redirects.

The package is ESM-first, targets Node.js 20+, uses native `fetch`, `Blob`, and `FormData`, and has no runtime dependencies.

Use it for:

- Publishing workflows in servers, CI, and agent runtimes.
- Reading published content for websites and build jobs.
- Uploading media through native `FormData`.
- Managing taxonomy and localized content.
- Fetching sitemap and feed XML.

The SDK intentionally excludes dashboard-only session, billing, audit, admin, API-key helper, and organization settings routes.

## Getting Started

Install the package:

```sh
npm install @cli-blog/node
```

Create a client:

```ts
import { CliBlog } from "@cli-blog/node";

const cliBlog = new CliBlog({
  apiKey: process.env.CLI_BLOG_API_KEY!,
});
```

Use `apiUrl` for local development or self-hosted environments:

```ts
const cliBlog = new CliBlog({
  apiKey: process.env.CLI_BLOG_API_KEY!,
  apiUrl: process.env.CLI_BLOG_API_URL,
});
```

Use public keys for published-content reads. Use private keys only from trusted servers, CI, CLIs, and agent runtimes. Never expose private keys in browser code.

## Reference

Client configuration:

```ts
type CliBlogConfig = {
  apiKey: string;
  apiUrl?: string;
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

Resources:

| Resource | Methods |
| --- | --- |
| `cliBlog.posts` | `list`, `paginate`, `get`, `create`, `update`, `publish`, `schedule`, `delete` |
| `cliBlog.posts.revisions` | `list`, `get` |
| `cliBlog.posts.slugRedirects` | `get` |
| `cliBlog.authors` | `list`, `get`, `create`, `update`, `delete` |
| `cliBlog.media` | `list`, `get`, `upload`, `update`, `delete` |
| `cliBlog.categories` | `list`, `get`, `create`, `update`, `delete` |
| `cliBlog.tags` | `list`, `get`, `create`, `update`, `delete` |
| `cliBlog.locales` | `list` |
| `cliBlog.sitemap` | `get` |
| `cliBlog.feed` | `get` |

List responses use the API cursor shape:

```ts
type ListResponse<T> = {
  object: "list";
  data: T[];
  has_more?: boolean;
  next_cursor?: string | null;
};
```

The SDK retries safe requests on transient statuses such as `408`, `409`, `425`, `429`, and `5xx`. Mutating requests are not retried automatically.

## Examples

Create and publish a post:

```ts
import { CliBlog } from "@cli-blog/node";

const cliBlog = new CliBlog({
  apiKey: process.env.CLI_BLOG_API_KEY!,
});

const author = await cliBlog.authors.create({
  public_name: "Ada Lovelace",
  bio: "Notes from the engine room.",
});

const category = await cliBlog.categories.create({
  name: "Product Updates",
  locale: "en-US",
});

const tag = await cliBlog.tags.create({
  name: "release",
  locale: "en-US",
});

const post = await cliBlog.posts.create({
  title: "First post",
  body_markdown: "# Hello",
  author_profile_ids: [author.id],
  category_ids: [category.id],
  tag_ids: [tag.id],
  seo_title: "First post",
  seo_description: "A launch note published through the SDK.",
});

await cliBlog.posts.publish(post.id, {
  expected_version: post.version,
});
```

Read published posts:

```ts
const posts = await cliBlog.posts.list({
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

Paginate through posts:

```ts
for await (const post of cliBlog.posts.paginate({ status: "published", limit: 50 })) {
  console.log(post.id);
}
```

Update, schedule, and delete posts:

```ts
const updated = await cliBlog.posts.update("first-post", {
  excerpt: "Updated summary",
  expected_version: 2,
});

await cliBlog.posts.schedule(updated.id, "2026-06-18T16:00:00.000Z", {
  expected_version: updated.version,
});

await cliBlog.posts.delete(updated.id);
```

Upload media:

```ts
import { readFile } from "node:fs/promises";

const file = new Blob([await readFile("cover.png")], { type: "image/png" });

const media = await cliBlog.media.upload({
  file,
  filename: "cover.png",
  alt_text: "Cover image",
  caption: "Launch dashboard.",
  metadata: { source: "release-notes" },
});
```

Attach media to a post:

```ts
await cliBlog.posts.update("first-post", {
  featured_media_asset_id: media.id,
});
```

Work with taxonomy and localization:

```ts
const locales = await cliBlog.locales.list();

const spanishCategory = await cliBlog.categories.create({
  name: "Noticias",
  slug: "noticias",
  locale: "es-MX",
});

const tags = await cliBlog.tags.list({
  locale: "es-MX",
  include: ["translations"],
});

console.log(locales.map((locale) => locale.tag), spanishCategory.id, tags.data.length);
```

Fetch revisions and redirects:

```ts
const revisions = await cliBlog.posts.revisions.list("first-post", {
  locale: "en-US",
});

const revision = await cliBlog.posts.revisions.get("first-post", revisions.data[0]!.id);

const redirect = await cliBlog.posts.slugRedirects.get("old-first-post", {
  locale: "en-US",
});

console.log(revision.version, redirect.to_slug);
```

Fetch sitemap and feed XML:

```ts
const sitemapXml = await cliBlog.sitemap.get({ locale: "en-US", limit: 100 });
const feedXml = await cliBlog.feed.get({ locale: "en-US", limit: 20 });
```

Use request options:

```ts
const controller = new AbortController();

const posts = await cliBlog.posts.list(
  { status: "published" },
  {
    apiKey: process.env.CLI_BLOG_PUBLIC_KEY,
    signal: controller.signal,
  },
);
```

Handle errors:

```ts
import { CliBlogError } from "@cli-blog/node";

try {
  await cliBlog.posts.create({ title: "Draft" });
} catch (error) {
  if (error instanceof CliBlogError) {
    console.error(error.code, error.status, error.requestId);
  }
  throw error;
}
```

## Security

- Never expose private API keys in browser code.
- Prefer environment variables or secret managers for private keys.
- Use public keys for published delivery reads.
- Use private keys for trusted publishing and editorial workflows.
- The SDK uses native platform APIs and does not add runtime dependencies.
