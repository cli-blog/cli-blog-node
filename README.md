<p align="center">
  <a href="https://cli-blog.com">
    <img src="https://cli-blog.com/cli-blog-logo.png" alt="Cli Blog" width="72" height="72" />
  </a>
</p>

# @cli-blog/node

Official Node.js SDK for the Cli Blog API.

[Homepage](https://cli-blog.com) · [Documentation](https://cli-blog.com/docs) · [SDK Docs](https://cli-blog.com/docs/node-package) · [API Reference](https://cli-blog.com/docs/reference/endpoints) · [Agent Skill](https://github.com/cli-blog/cli-blog-skill) · [GitHub](https://github.com/cli-blog/cli-blog-node)

## What Is This?

`@cli-blog/node` lets trusted JavaScript runtimes publish and deliver [Cli Blog](https://cli-blog.com) content through the public `/v1` API. Use it from servers, build jobs, CI, CLIs, and AI agent runtimes to work with posts, authors, media, categories, tags, locales, sitemap XML, feed XML, revisions, and slug redirects.

The SDK is ESM-first, requires Node.js 20 or newer, uses native `fetch`, `Blob`, and `FormData`, and has no runtime dependencies.

## Install

With npm:

```sh
npm install @cli-blog/node
```

With Bun:

```sh
bun add @cli-blog/node
```

With pnpm:

```sh
pnpm add @cli-blog/node
```

Create a client with an organization API key:

```js
import { CliBlog } from "@cli-blog/node";

const apiKey = process.env.CLI_BLOG_API_KEY;
if (!apiKey) throw new Error("CLI_BLOG_API_KEY is required");

const blog = new CliBlog({
  apiKey,
});
```

The same import and runtime API work in plain JavaScript ESM and TypeScript. TypeScript projects receive declarations and inference from this package; no separate types package is required.

Use public keys for published-content reads. Use private keys only from trusted servers, CI, CLIs, and agent runtimes. Never expose private keys in browser code.

## Quick Example

Create a draft, then publish a San Francisco story:

```ts
const author = await blog.authors.create({
  public_name: "Maya Chen",
  bio: "Field notes from San Francisco.",
});

const category = await blog.categories.create({
  name: "San Francisco",
  locale: "en-US", // optional; omit to use your organization's default locale.
});

const tag = await blog.tags.create({
  name: "City Notes",
  locale: "en-US", // optional.
});

const draft = await blog.posts.create({
  title: "A developer's guide to San Francisco",
  body_markdown: "## Fog, hills, and neighborhoods\n\nA short guide to building and wandering in San Francisco.",
  author_profile_ids: [author.id],
  category_ids: [category.id],
  tag_ids: [tag.id],
  locale: "en-US", // optional.
  seo_title: "A developer's guide to San Francisco",
  seo_description: "A local story about parks, neighborhoods, and builder life in San Francisco.",
});

const published = await blog.posts.publish(draft.id, {
  expected_version: draft.version,
});
```

`publish()` is a convenience helper for the common review-then-publish flow. The canonical API model is still the post `status` field: creating or updating a post with `status: "published"` also publishes it, while omitting `status` on create defaults to `draft`.

Expected result shape:

```ts
{
  id: "post_...",
  object: "post",
  locale: "en-US",
  status: "published",
  title: "A developer's guide to San Francisco",
  slug: "developers-guide-to-san-francisco",
  version: 2,
  published_at: "2026-06-18T16:00:00.000Z",
}
```

## Resources

All list methods return:

```ts
{
  object: "list",
  data: [],
  has_more: false,
  next_cursor: null,
}
```

Use `limit` to control page size. Use `after` with `next_cursor` to fetch the next page. Cursor-list resources also expose `paginate()` when you want the SDK to follow cursors for you. Unless a field is labeled required, it is optional.

For exact numbered pages, pass `page` and optional `per_page` to `list()`. Numbered list responses include `page`, `per_page`, `total_items`, and `total_pages` in addition to `has_more` and `next_cursor`. Do not combine `page`/`per_page` with `after`/`limit`; use cursor controls with `paginate()`.

### Posts

| Method | Use it for | Common parameters |
| --- | --- | --- |
| `blog.posts.list(params)` | List posts. | Optional: `status`, `locale`, `limit`, `after`, `page`, `per_page`, `search`, `sort`, `direction`, `fields`, `include`, `is_featured`, author/category/tag filters. |
| `blog.posts.paginate(params)` | Iterate through all matching posts using cursors. | Same filters as `list`, with cursor controls only. |
| `blog.posts.get(idOrSlug, params)` | Fetch one post by ID or slug. | Optional: `locale`, `fields`, `include`. |
| `blog.posts.create(input)` | Create a draft, scheduled, or published post. | Required: `title`. Optional: `body_markdown`, `locale`, `status`, `author_profile_ids`, `category_ids`, `tag_ids`, `media_asset_ids`, SEO fields. Omitted `status` defaults to `draft`. |
| `blog.posts.update(idOrSlug, input, params)` | Update a post, including direct status changes. | Optional: `expected_version`, fields to change, `status`, `locale` lookup. |
| `blog.posts.publish(idOrSlug, input, params)` | Convenience helper for `update(..., { status: "published" })`. | Optional: `expected_version`, `published_at`, `locale`. |
| `blog.posts.schedule(idOrSlug, scheduledAt, input, params)` | Schedule a post. | ISO datetime and optional `expected_version`. |
| `blog.posts.delete(idOrSlug, params)` | Archive/delete a post through the API. | Optional `locale`. |

Post filters:

```ts
const posts = await blog.posts.list({
  status: "published",
  locale: "en-US", // optional; omit to use your organization's default locale.
  limit: 20,
  search: "coffee",
  sort: "published_at",
  direction: "desc",
  fields: ["summary", "seo"],
  include: ["authors", "categories", "tags", "media"],
  category_slug: "san-francisco",
  category_match: "all",
  tag_slug: ["city-notes", "parks"],
  exclude_tag_slug: ["internal"],
});
```

Direct status updates:

```ts
await blog.posts.update(draft.id, {
  status: "published",
  expected_version: draft.version,
});

const publishedOnCreate = await blog.posts.create({
  title: "Launch notes",
  body_markdown: "Published immediately.",
  status: "published",
});
```

Numbered pagination:

```ts
const page = await blog.posts.list({
  page: 2,
  per_page: 20,
  status: "published",
  fields: ["summary", "seo"],
});

console.log(page.total_items, page.total_pages);
```

Expected result shape:

```ts
{
  object: "list",
  data: [
    {
      id: "post_123",
      object: "post",
      title: "A developer's guide to San Francisco",
      slug: "developers-guide-to-san-francisco",
      status: "published",
      locale: "en-US",
      seo_title: "A developer's guide to San Francisco",
      authors: [{ id: "author_123", object: "author", public_name: "Maya Chen" }],
      categories: [{ id: "term_123", object: "taxonomy_term", name: "San Francisco" }],
      tags: [{ id: "term_456", object: "taxonomy_term", name: "City Notes" }],
      media: [{ id: "media_123", object: "media_asset", url: "https://..." }],
    },
  ],
  has_more: false,
  next_cursor: null,
}
```

Field groups control which post fields are returned:

| Field group | Use it when you need |
| --- | --- |
| `summary` | IDs, title, slug, locale, status, excerpt, timestamps. |
| `content` | Markdown body and content fields. |
| `seo` | SEO, robots, Open Graph, Twitter, and schema fields. |
| `workflow` | Editorial state such as scheduling and version fields. |
| `metadata` | Custom metadata. |

Includes add related objects:

| Include | Adds |
| --- | --- |
| `authors` | Author profile objects. |
| `categories` | Category term objects. |
| `tags` | Tag term objects. |
| `media` | Referenced media asset objects. |
| `translations` | Linked translation summaries. |

### Authors

| Method | Use it for | Common parameters |
| --- | --- | --- |
| `blog.authors.list(params)` / `blog.authors.paginate(params)` | List or iterate through public author profiles. | `limit`, `after`, or `page`, `per_page` for `list()`. |
| `blog.authors.get(idOrSlug)` | Fetch an author. | Author ID or slug. |
| `blog.authors.create(input)` | Create an author. | Required: `public_name`. Optional: `slug`, `bio`, `avatar_media_id`, `website_url`, `metadata`. |
| `blog.authors.update(idOrSlug, input)` | Update an author. | Any editable author field. |
| `blog.authors.delete(idOrSlug)` | Delete an author. | Author ID or slug. |

```ts
const author = await blog.authors.create({
  public_name: "Maya Chen",
  bio: "Field notes from San Francisco.",
  website_url: "https://example.com/authors/maya-chen",
});
```

Expected result shape:

```ts
{
  id: "author_123",
  object: "author",
  public_name: "Maya Chen",
  slug: "maya-chen",
  bio: "Field notes from San Francisco.",
  avatar_media_id: null,
  avatar_url: null,
  website_url: "https://example.com/authors/maya-chen",
}
```

### Media

| Method | Use it for | Common parameters |
| --- | --- | --- |
| `blog.media.list(params)` / `blog.media.paginate(params)` | List or iterate through uploaded media assets. | `limit`, `after`, or `page`, `per_page` for `list()`. |
| `blog.media.get(id)` | Fetch one media asset. | Media ID. |
| `blog.media.upload(input)` | Upload a file. | `file`, `filename`, `alt_text`, `caption`, `metadata`. |
| `blog.media.update(id, input)` | Update media metadata. | `alt_text`, `caption`, `metadata`. |
| `blog.media.delete(id)` | Delete a media asset. | Media ID. |

```ts
import { readFile } from "node:fs/promises";

const file = new Blob([await readFile("bay-walk.png")], { type: "image/png" });

const media = await blog.media.upload({
  file,
  filename: "bay-walk.png",
  alt_text: "Morning light over San Francisco Bay",
  caption: "A local image for a San Francisco story.",
});
```

Expected result shape:

```ts
{
  id: "media_123",
  object: "media_asset",
  url: "https://cdn.example.com/media/bay-walk.png",
  original_filename: "bay-walk.png",
  alt_text: "Morning light over San Francisco Bay",
  caption: "A local image for a San Francisco story.",
  mime_type: "image/png",
  width: 1600,
  height: 900,
}
```

### Categories And Tags

Categories and tags use the same methods. Categories can have parent categories; tags are flat labels.

| Method | Use it for | Common parameters |
| --- | --- | --- |
| `blog.categories.list(params)` / `blog.tags.list(params)` | List taxonomy terms. Use `paginate(params)` to iterate through cursor pages. | `locale`, `include`, `limit`, `after`, or `page`, `per_page` for `list()`. |
| `blog.categories.get(idOrSlug, params)` / `blog.tags.get(idOrSlug, params)` | Fetch a term. | `locale`, `include`. |
| `blog.categories.create(input)` / `blog.tags.create(input)` | Create a term. | `name`, `slug`, `locale`, `description`, SEO fields, `translation_of_id`. |
| `blog.categories.update(idOrSlug, input, params)` / `blog.tags.update(idOrSlug, input, params)` | Update a term. | Any editable term field, optional `locale`. |
| `blog.categories.delete(idOrSlug, params)` / `blog.tags.delete(idOrSlug, params)` | Delete a term. | Optional `locale`. |

```ts
const category = await blog.categories.create({
  name: "San Francisco",
  locale: "en-US", // optional.
  description: "Neighborhood guides, food notes, and local stories.",
});

const tag = await blog.tags.create({
  name: "City Notes",
  locale: "en-US", // optional.
});
```

Expected result shape:

```ts
{
  id: "term_123",
  object: "taxonomy_term",
  taxonomy_type: "category",
  locale: "en-US",
  name: "San Francisco",
  slug: "san-francisco",
  description: "Neighborhood guides, food notes, and local stories.",
  translations: undefined,
}
```

Use `include: ["translations"]` when you need translation summaries:

```ts
const categories = await blog.categories.list({
  locale: "es-MX", // optional; include it when reading a specific language.
  include: ["translations"],
});
```

### Locales

```ts
const locales = await blog.locales.list();
```

Expected result shape:

```ts
[
  { tag: "en-US", name: "English (United States)", language: "English", region: "United States" },
  { tag: "es-MX", name: "Spanish (Mexico)", language: "Spanish", region: "Mexico" },
]
```

### Revisions And Redirects

```ts
const revisions = await blog.posts.revisions.list("developers-guide-to-san-francisco", {
  locale: "en-US", // optional.
  limit: 10,
});

const revision = await blog.posts.revisions.get(
  "developers-guide-to-san-francisco",
  revisions.data[0]!.id,
  { locale: "en-US" }, // optional.
);

const redirect = await blog.posts.slugRedirects.get("old-san-francisco-guide", {
  locale: "en-US", // optional.
});
```

Expected result shape:

```ts
{
  revision: {
    id: "rev_123",
    object: "post_revision",
    parent_post_id: "post_123",
    title: "A developer's guide to San Francisco",
    version: 1,
    body_markdown: "## Fog, hills...",
  },
  redirect: {
    object: "slug_redirect",
    from_slug: "old-san-francisco-guide",
    to_slug: "developers-guide-to-san-francisco",
    status_code: 301,
  },
}
```

### Sitemap And Feed

```ts
const sitemapXml = await blog.sitemap.get({ locale: "en-US", limit: 100 }); // locale is optional.
const feedXml = await blog.feed.get({ locale: "en-US", limit: 20 }); // locale is optional.
```

Expected result shape:

```ts
sitemapXml.startsWith("<?xml"); // true
feedXml.includes("<rss"); // true
```

## Framework Examples

### Next.js App Router

Use the SDK in server components, route handlers, or server actions. Do not import it into client components with a private key.

```ts
// app/blog/page.tsx
import { CliBlog } from "@cli-blog/node";

const blog = new CliBlog({ apiKey: process.env.CLI_BLOG_PUBLIC_KEY! });

export default async function BlogPage() {
  const posts = await blog.posts.list({
    status: "published",
    fields: ["summary", "seo"],
    include: ["authors"],
    locale: "en-US",
  });

  return posts.data.map((post) => <article key={post.id}>{post.title}</article>);
}
```

### Next.js Route Handler

```ts
// app/api/blog/posts/route.ts
import { CliBlog } from "@cli-blog/node";

const blog = new CliBlog({ apiKey: process.env.CLI_BLOG_PUBLIC_KEY! });

export async function GET() {
  const posts = await blog.posts.list({ status: "published", limit: 10 });
  return Response.json(posts);
}
```

### Astro

```astro
---
import { CliBlog } from "@cli-blog/node";

const blog = new CliBlog({ apiKey: import.meta.env.CLI_BLOG_PUBLIC_KEY });
const posts = await blog.posts.list({ status: "published", fields: ["summary"] });
---

{posts.data.map((post) => <article><h2>{post.title}</h2></article>)}
```

### React Or Vite

React apps run in the browser, so do not put private keys there. Create a small server route with the SDK, then call that route from React.

```tsx
// React component
const response = await fetch("/api/blog/posts");
const posts = await response.json();
```

### Remix Or React Router

```ts
// app/routes/blog._index.tsx
import { CliBlog } from "@cli-blog/node";

export async function loader() {
  const blog = new CliBlog({ apiKey: process.env.CLI_BLOG_PUBLIC_KEY! });
  return blog.posts.list({ status: "published", fields: ["summary"] });
}
```

## AI Agent Skill

If you want an AI coding agent to add Cli Blog to an application, use the [Cli Blog agent skill](https://github.com/cli-blog/cli-blog-skill). It includes guidance for choosing the API, SDK, or CLI, plus framework patterns for common app stacks.

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
      param: error.param,
      message: error.message,
      requestId: error.requestId,
      status: error.status,
    });
  }
  throw error;
}
```

Common cases:

| Status / code | When to expect it | What to do |
| --- | --- | --- |
| `missing_api_key` | The client was created without an API key. | Pass `apiKey` from a secret or environment variable. |
| `401` | The key is missing or invalid. | Check the key value and organization. |
| `403` / `forbidden` | The key type or scopes do not allow the action. | Use a private key for trusted writes and the right permissions. |
| `404` / `not_found` | The resource ID or locale-scoped slug does not exist. | Check the ID, slug, and locale. |
| `409` | Optimistic concurrency failed, usually from stale `expected_version`. | Fetch the latest post and retry with the current version. |
| `429` | Rate or plan limit reached. | Honor `Retry-After` when present; otherwise inspect the plan limit and usage state. |
| `5xx` | Temporary API or upstream failure. | Retry later; safe requests are retried automatically by the SDK. |

Safe read requests are retried automatically for network failures and transient statuses such as `408`, `425`, and selected `5xx` responses. A `429` is retried only when the API supplies `Retry-After`. Conflicts and hard plan limits are returned immediately. Mutating requests are not retried automatically.

## Security

- Never expose private API keys in browser code.
- Prefer environment variables or secret managers for private keys.
- Use public keys for published delivery reads.
- Use private keys for trusted publishing and editorial workflows.
- The SDK uses native platform APIs and does not add runtime dependencies.
