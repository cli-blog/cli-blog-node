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
export type {
  ApiKeyKind,
  Author,
  ContentStatus,
  CreateAuthorInput,
  CreatePostInput,
  CreateTermInput,
  DeleteResponse,
  FeedParams,
  ListParams,
  ListResponse,
  Locale,
  MediaAsset,
  Post,
  PostFieldGroup,
  PostGetParams,
  PostInclude,
  PostListParams,
  PostRevision,
  PostRevisionGetParams,
  PostRevisionListParams,
  PostRevisionSummary,
  RequestOptions,
  SeoFields,
  SitemapParams,
  SlugRedirect,
  SlugRedirectParams,
  TaxonomyTerm,
  TermInclude,
  TermListParams,
  UpdateAuthorInput,
  UpdateMediaInput,
  UpdatePostInput,
  UpdateTermInput,
  UploadMediaInput,
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
