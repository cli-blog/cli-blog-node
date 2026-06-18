import { csv, type HttpClient } from "./http.js";
import type {
  Author,
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
  PostGetParams,
  PostListParams,
  PostRevision,
  PostRevisionGetParams,
  PostRevisionListParams,
  PostRevisionSummary,
  RequestOptions,
  SitemapParams,
  SlugRedirect,
  SlugRedirectParams,
  TaxonomyTerm,
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
});

export class PostRevisionsResource {
  constructor(private readonly http: HttpClient) {}

  list(idOrSlug: string, params: PostRevisionListParams = {}, options?: RequestOptions): Promise<ListResponse<PostRevisionSummary>> {
    return this.http.list<PostRevisionSummary>(`/v1/posts/${encodeURIComponent(idOrSlug)}/revisions`, {
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

  list(params: PostListParams = {}, options?: RequestOptions): Promise<ListResponse<Post>> {
    return this.http.list<Post>("/v1/posts", {
      ...options,
      query: {
        ...listQuery(params),
        locale: params.locale,
        status: params.status,
        is_featured: params.is_featured,
        author_id: csv(params.author_id),
        author_slug: csv(params.author_slug),
        category_id: csv(params.category_id),
        category_slug: csv(params.category_slug),
        tag_id: csv(params.tag_id),
        tag_slug: csv(params.tag_slug),
        search: params.search,
        sort: params.sort,
        direction: params.direction,
        fields: params.fields,
        include: params.include,
      },
    });
  }

  paginate(params: PostListParams = {}, options?: RequestOptions): AsyncGenerator<Post, void, unknown> {
    return this.http.paginate<Post>("/v1/posts", {
      ...options,
      query: {
        ...listQuery(params),
        locale: params.locale,
        status: params.status,
        is_featured: params.is_featured,
        author_id: csv(params.author_id),
        author_slug: csv(params.author_slug),
        category_id: csv(params.category_id),
        category_slug: csv(params.category_slug),
        tag_id: csv(params.tag_id),
        tag_slug: csv(params.tag_slug),
        search: params.search,
        sort: params.sort,
        direction: params.direction,
        fields: params.fields,
        include: params.include,
      },
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

  list(params: ListParams = {}, options?: RequestOptions): Promise<ListResponse<Author>> {
    return this.http.list<Author>("/v1/authors", { ...options, query: listQuery(params) });
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

  list(params: ListParams = {}, options?: RequestOptions): Promise<ListResponse<MediaAsset>> {
    return this.http.list<MediaAsset>("/v1/media", { ...options, query: listQuery(params) });
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

class TaxonomyResource {
  constructor(
    private readonly http: HttpClient,
    private readonly path: "/v1/categories" | "/v1/tags",
  ) {}

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

  get(idOrSlug: string, params: { locale?: string; include?: string | string[] } = {}, options?: RequestOptions): Promise<TaxonomyTerm> {
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
