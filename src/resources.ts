import { csv, type HttpClient } from "./http.js";
import type {
  Author,
  CreateAuthorInput,
  CreatePostInput,
  CreateTermInput,
  CursorListParams,
  CursorListResponse,
  DeleteResponse,
  FeedParams,
  ListParams,
  ListResponse,
  Locale,
  MediaAsset,
  NumberedListParams,
  NumberedListResponse,
  Post,
  PostGetParams,
  PostListFilters,
  PostListParams,
  PostRevision,
  PostRevisionGetParams,
  PostRevisionListFilters,
  PostRevisionListParams,
  PostRevisionSummary,
  RequestOptions,
  SitemapParams,
  SlugRedirect,
  SlugRedirectParams,
  TaxonomyTerm,
  TermInclude,
  TermListFilters,
  TermListParams,
  UpdateAuthorInput,
  UpdateMediaInput,
  UpdatePostInput,
  UpdateTermInput,
  UploadMediaInput,
} from "./types.js";

const listQuery = (params?: ListParams) => ({
  after: params?.after,
  limit: params?.limit,
  page: params?.page,
  per_page: params?.per_page,
});

const postListQuery = (params: PostListParams) => ({
  ...listQuery(params),
  locale: params.locale,
  status: params.status,
  is_featured: params.is_featured,
  author_id: csv(params.author_id),
  author_slug: csv(params.author_slug),
  author_match: params.author_match,
  exclude_author_id: csv(params.exclude_author_id),
  exclude_author_slug: csv(params.exclude_author_slug),
  category_id: csv(params.category_id),
  category_slug: csv(params.category_slug),
  category_match: params.category_match,
  exclude_category_id: csv(params.exclude_category_id),
  exclude_category_slug: csv(params.exclude_category_slug),
  tag_id: csv(params.tag_id),
  tag_slug: csv(params.tag_slug),
  tag_match: params.tag_match,
  exclude_tag_id: csv(params.exclude_tag_id),
  exclude_tag_slug: csv(params.exclude_tag_slug),
  search: params.search,
  sort: params.sort,
  direction: params.direction,
  fields: params.fields,
  include: params.include,
});

export class PostRevisionsResource {
  constructor(private readonly http: HttpClient) {}

  list(
    idOrSlug: string,
    params: PostRevisionListFilters & NumberedListParams,
    options?: RequestOptions,
  ): Promise<NumberedListResponse<PostRevisionSummary>>;
  list(
    idOrSlug: string,
    params?: PostRevisionListFilters & CursorListParams,
    options?: RequestOptions,
  ): Promise<CursorListResponse<PostRevisionSummary>>;
  list(idOrSlug: string, params: PostRevisionListParams, options?: RequestOptions): Promise<ListResponse<PostRevisionSummary>>;
  list(idOrSlug: string, params: PostRevisionListParams = {}, options?: RequestOptions): Promise<ListResponse<PostRevisionSummary>> {
    return this.http.list<PostRevisionSummary>(`/v1/posts/${encodeURIComponent(idOrSlug)}/revisions`, {
      ...options,
      query: {
        ...listQuery(params),
        locale: params.locale,
      },
    });
  }

  paginate(
    idOrSlug: string,
    params: PostRevisionListFilters & CursorListParams = {},
    options?: RequestOptions,
  ): AsyncGenerator<PostRevisionSummary, void, unknown> {
    return this.http.paginate<PostRevisionSummary>(`/v1/posts/${encodeURIComponent(idOrSlug)}/revisions`, {
      ...options,
      query: {
        ...listQuery(params),
        locale: params.locale,
      },
    });
  }

  get(idOrSlug: string, revisionId: string, params: PostRevisionGetParams = {}, options?: RequestOptions): Promise<PostRevision> {
    return this.http.request<PostRevision>(
      "GET",
      `/v1/posts/${encodeURIComponent(idOrSlug)}/revisions/${encodeURIComponent(revisionId)}`,
      {
        ...options,
        query: params,
      },
    );
  }
}

export class PostSlugRedirectsResource {
  constructor(private readonly http: HttpClient) {}

  get(slug: string, params: SlugRedirectParams = {}, options?: RequestOptions): Promise<SlugRedirect> {
    return this.http.request<SlugRedirect>("GET", `/v1/posts/slug-redirects/${encodeURIComponent(slug)}`, {
      ...options,
      query: params,
    });
  }
}

export class PostsResource {
  readonly revisions: PostRevisionsResource;
  readonly slugRedirects: PostSlugRedirectsResource;

  constructor(private readonly http: HttpClient) {
    this.revisions = new PostRevisionsResource(http);
    this.slugRedirects = new PostSlugRedirectsResource(http);
  }

  list(params: PostListFilters & NumberedListParams, options?: RequestOptions): Promise<NumberedListResponse<Post>>;
  list(params?: PostListFilters & CursorListParams, options?: RequestOptions): Promise<CursorListResponse<Post>>;
  list(params: PostListParams, options?: RequestOptions): Promise<ListResponse<Post>>;
  list(params: PostListParams = {}, options?: RequestOptions): Promise<ListResponse<Post>> {
    return this.http.list<Post>("/v1/posts", {
      ...options,
      query: postListQuery(params),
    });
  }

  paginate(params: PostListFilters & CursorListParams = {}, options?: RequestOptions): AsyncGenerator<Post, void, unknown> {
    return this.http.paginate<Post>("/v1/posts", {
      ...options,
      query: postListQuery(params),
    });
  }

  get(idOrSlug: string, params: PostGetParams = {}, options?: RequestOptions): Promise<Post> {
    return this.http.request<Post>("GET", `/v1/posts/${encodeURIComponent(idOrSlug)}`, {
      ...options,
      query: params,
    });
  }

  create(input: CreatePostInput, options?: RequestOptions): Promise<Post> {
    return this.http.request<Post>("POST", "/v1/posts", { ...options, body: input });
  }

  update(idOrSlug: string, input: UpdatePostInput, params: { locale?: string } = {}, options?: RequestOptions): Promise<Post> {
    return this.http.request<Post>("POST", `/v1/posts/${encodeURIComponent(idOrSlug)}`, {
      ...options,
      body: input,
      query: params,
    });
  }

  publish(
    idOrSlug: string,
    input: Omit<UpdatePostInput, "status"> = {},
    params: { locale?: string } = {},
    options?: RequestOptions,
  ): Promise<Post> {
    return this.update(idOrSlug, { ...input, status: "published" }, params, options);
  }

  schedule(
    idOrSlug: string,
    scheduledAt: string,
    input: Omit<UpdatePostInput, "scheduled_at" | "status"> = {},
    params: { locale?: string } = {},
    options?: RequestOptions,
  ) {
    return this.update(idOrSlug, { ...input, scheduled_at: scheduledAt, status: "scheduled" }, params, options);
  }

  delete(idOrSlug: string, params: { locale?: string } = {}, options?: RequestOptions): Promise<Post> {
    return this.http.request<Post>("DELETE", `/v1/posts/${encodeURIComponent(idOrSlug)}`, {
      ...options,
      query: params,
    });
  }
}

export class AuthorsResource {
  constructor(private readonly http: HttpClient) {}

  list(params: NumberedListParams, options?: RequestOptions): Promise<NumberedListResponse<Author>>;
  list(params?: CursorListParams, options?: RequestOptions): Promise<CursorListResponse<Author>>;
  list(params: ListParams, options?: RequestOptions): Promise<ListResponse<Author>>;
  list(params: ListParams = {}, options?: RequestOptions): Promise<ListResponse<Author>> {
    return this.http.list<Author>("/v1/authors", { ...options, query: listQuery(params) });
  }

  paginate(params: CursorListParams = {}, options?: RequestOptions): AsyncGenerator<Author, void, unknown> {
    return this.http.paginate<Author>("/v1/authors", { ...options, query: listQuery(params) });
  }

  get(idOrSlug: string, options?: RequestOptions): Promise<Author> {
    return this.http.request<Author>("GET", `/v1/authors/${encodeURIComponent(idOrSlug)}`, options);
  }

  create(input: CreateAuthorInput, options?: RequestOptions): Promise<Author> {
    return this.http.request<Author>("POST", "/v1/authors", { ...options, body: input });
  }

  update(idOrSlug: string, input: UpdateAuthorInput, options?: RequestOptions): Promise<Author> {
    return this.http.request<Author>("POST", `/v1/authors/${encodeURIComponent(idOrSlug)}`, { ...options, body: input });
  }

  delete(idOrSlug: string, options?: RequestOptions): Promise<DeleteResponse> {
    return this.http.request("DELETE", `/v1/authors/${encodeURIComponent(idOrSlug)}`, options);
  }
}

export class MediaResource {
  constructor(private readonly http: HttpClient) {}

  list(params: NumberedListParams, options?: RequestOptions): Promise<NumberedListResponse<MediaAsset>>;
  list(params?: CursorListParams, options?: RequestOptions): Promise<CursorListResponse<MediaAsset>>;
  list(params: ListParams, options?: RequestOptions): Promise<ListResponse<MediaAsset>>;
  list(params: ListParams = {}, options?: RequestOptions): Promise<ListResponse<MediaAsset>> {
    return this.http.list<MediaAsset>("/v1/media", { ...options, query: listQuery(params) });
  }

  paginate(params: CursorListParams = {}, options?: RequestOptions): AsyncGenerator<MediaAsset, void, unknown> {
    return this.http.paginate<MediaAsset>("/v1/media", { ...options, query: listQuery(params) });
  }

  get(id: string, options?: RequestOptions): Promise<MediaAsset> {
    return this.http.request<MediaAsset>("GET", `/v1/media/${encodeURIComponent(id)}`, options);
  }

  upload(input: UploadMediaInput, options?: RequestOptions): Promise<MediaAsset> {
    const formData = new FormData();
    formData.set("file", input.file, input.filename);
    if (input.alt_text !== undefined) formData.set("alt_text", input.alt_text ?? "");
    if (input.caption !== undefined) formData.set("caption", input.caption ?? "");
    if (input.metadata !== undefined) formData.set("metadata", JSON.stringify(input.metadata));

    return this.http.request<MediaAsset>("POST", "/v1/media", { ...options, formData });
  }

  update(id: string, input: UpdateMediaInput, options?: RequestOptions): Promise<MediaAsset> {
    return this.http.request<MediaAsset>("POST", `/v1/media/${encodeURIComponent(id)}`, { ...options, body: input });
  }

  delete(id: string, options?: RequestOptions): Promise<DeleteResponse> {
    return this.http.request("DELETE", `/v1/media/${encodeURIComponent(id)}`, options);
  }
}

export class TaxonomyResource {
  constructor(
    private readonly http: HttpClient,
    private readonly path: "/v1/categories" | "/v1/tags",
  ) {}

  list(params: TermListFilters & NumberedListParams, options?: RequestOptions): Promise<NumberedListResponse<TaxonomyTerm>>;
  list(params?: TermListFilters & CursorListParams, options?: RequestOptions): Promise<CursorListResponse<TaxonomyTerm>>;
  list(params: TermListParams, options?: RequestOptions): Promise<ListResponse<TaxonomyTerm>>;
  list(params: TermListParams = {}, options?: RequestOptions): Promise<ListResponse<TaxonomyTerm>> {
    return this.http.list<TaxonomyTerm>(this.path, {
      ...options,
      query: {
        ...listQuery(params),
        locale: params.locale,
        include: params.include,
      },
    });
  }

  paginate(params: TermListFilters & CursorListParams = {}, options?: RequestOptions): AsyncGenerator<TaxonomyTerm, void, unknown> {
    return this.http.paginate<TaxonomyTerm>(this.path, {
      ...options,
      query: {
        ...listQuery(params),
        locale: params.locale,
        include: params.include,
      },
    });
  }

  get(idOrSlug: string, params: { locale?: string; include?: TermInclude | TermInclude[] } = {}, options?: RequestOptions): Promise<TaxonomyTerm> {
    return this.http.request<TaxonomyTerm>("GET", `${this.path}/${encodeURIComponent(idOrSlug)}`, {
      ...options,
      query: params,
    });
  }

  create(input: CreateTermInput, options?: RequestOptions): Promise<TaxonomyTerm> {
    return this.http.request<TaxonomyTerm>("POST", this.path, { ...options, body: input });
  }

  update(idOrSlug: string, input: UpdateTermInput, params: { locale?: string } = {}, options?: RequestOptions): Promise<TaxonomyTerm> {
    return this.http.request<TaxonomyTerm>("POST", `${this.path}/${encodeURIComponent(idOrSlug)}`, {
      ...options,
      body: input,
      query: params,
    });
  }

  delete(idOrSlug: string, params: { locale?: string } = {}, options?: RequestOptions): Promise<DeleteResponse> {
    return this.http.request("DELETE", `${this.path}/${encodeURIComponent(idOrSlug)}`, {
      ...options,
      query: params,
    });
  }
}

export class LocalesResource {
  constructor(private readonly http: HttpClient) {}

  async list(options?: RequestOptions): Promise<Locale[]> {
    const response = await this.http.request<ListResponse<Locale>>("GET", "/v1/locales", options);
    return response.data;
  }
}

export class SitemapResource {
  constructor(private readonly http: HttpClient) {}

  get(params: SitemapParams = {}, options?: RequestOptions): Promise<string> {
    return this.http.text("GET", "/v1/sitemap", {
      ...options,
      query: params,
    });
  }
}

export class FeedResource {
  constructor(private readonly http: HttpClient) {}

  get(params: FeedParams = {}, options?: RequestOptions): Promise<string> {
    return this.http.text("GET", "/v1/feed", {
      ...options,
      query: params,
    });
  }
}

export const createCategoriesResource = (http: HttpClient) => new TaxonomyResource(http, "/v1/categories");
export const createTagsResource = (http: HttpClient) => new TaxonomyResource(http, "/v1/tags");
