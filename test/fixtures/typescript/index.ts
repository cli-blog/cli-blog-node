import {
  CliBlog,
  CliBlogError,
  type CliBlogConfig,
  type CreatePostInput,
  type CursorListResponse,
  type ListResponse,
  type NumberedListResponse,
  type Post,
  type PostListParams,
  type TaxonomyResource,
  type UploadMediaInput,
} from "@cli-blog/node";

const config = { apiKey: "<private-api-key>" } satisfies CliBlogConfig;
const blog = new CliBlog(config);

const input = {
  body_markdown: null,
  media_asset_ids: ["media_123"],
  metadata: { source: "fixture" },
  title: "Fixture post",
} satisfies CreatePostInput;

const filters = {
  author_match: "all",
  exclude_category_slug: ["private"],
  fields: ["summary", "content"],
} satisfies PostListParams;

const upload = {
  file: new Blob(["fixture"], { type: "text/plain" }),
  filename: "fixture.txt",
} satisfies UploadMediaInput;

const categories: TaxonomyResource = blog.categories;
void categories;
void filters;
void input;
void upload;

async function inferredTypes() {
  const page: CursorListResponse<Post> = await blog.posts.list(filters);
  const numberedPage: NumberedListResponse<Post> = await blog.posts.list({ ...filters, page: 1, per_page: 20 });
  const anyPage: ListResponse<Post> = Math.random() > 0.5 ? page : numberedPage;
  const error: CliBlogError | undefined = undefined;
  return { anyPage, error, numberedTotal: numberedPage.total_items, page };
}

void inferredTypes;
