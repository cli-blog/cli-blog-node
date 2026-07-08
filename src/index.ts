import { HttpClient, type ClientConfig } from "./http.js";
import {
  AuthorsResource,
  FeedResource,
  LocalesResource,
  MediaResource,
  PostsResource,
  SitemapResource,
  createCategoriesResource,
  createTagsResource,
} from "./resources.js";

export { CliBlogError } from "./error.js";
export type { CliBlogErrorOptions } from "./error.js";
export {
  AuthorsResource,
  FeedResource,
  LocalesResource,
  MediaResource,
  PostRevisionsResource,
  PostsResource,
  PostSlugRedirectsResource,
  SitemapResource,
  TaxonomyResource,
} from "./resources.js";
export type {
  ApiKeyKind,
  Author,
  BaseListResponse,
  ContentStatus,
  CreateAuthorInput,
  CreatePostInput,
  CreateTermInput,
  CursorListParams,
  CursorListResponse,
  DeleteResponse,
  FeedParams,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  ListParams,
  ListResponse,
  Locale,
  MediaAsset,
  Metadata,
  Nullable,
  NumberedListParams,
  NumberedListResponse,
  Post,
  PostFieldGroup,
  PostGetParams,
  PostInclude,
  PostListFilters,
  PostListParams,
  PostRevision,
  PostRevisionGetParams,
  PostRevisionListFilters,
  PostRevisionListParams,
  PostRevisionSummary,
  PostSort,
  RelationMatch,
  RequestOptions,
  SeoFields,
  SeoResponseFields,
  SitemapParams,
  SlugRedirect,
  SlugRedirectParams,
  TaxonomyTerm,
  TaxonomyType,
  TermInclude,
  TermListFilters,
  TermListParams,
  UpdateAuthorInput,
  UpdateMediaInput,
  UpdatePostInput,
  UpdateTermInput,
  UploadMediaInput,
  SortDirection,
} from "./types.js";

export type CliBlogConfig = ClientConfig;

export class CliBlog {
  readonly authors: AuthorsResource;
  readonly categories: ReturnType<typeof createCategoriesResource>;
  readonly feed: FeedResource;
  readonly locales: LocalesResource;
  readonly media: MediaResource;
  readonly posts: PostsResource;
  readonly sitemap: SitemapResource;
  readonly tags: ReturnType<typeof createTagsResource>;

  constructor(config: CliBlogConfig) {
    const http = new HttpClient(config);
    this.authors = new AuthorsResource(http);
    this.categories = createCategoriesResource(http);
    this.feed = new FeedResource(http);
    this.locales = new LocalesResource(http);
    this.media = new MediaResource(http);
    this.posts = new PostsResource(http);
    this.sitemap = new SitemapResource(http);
    this.tags = createTagsResource(http);
  }
}
