export type ApiKeyKind = "public" | "private";

export type RequestOptions = {
  apiKey?: string;
  signal?: AbortSignal;
};

export type BaseListResponse<T> = {
  object: "list";
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
};

export type CursorListResponse<T> = BaseListResponse<T> & {
  page?: never;
  per_page?: never;
  total_items?: never;
  total_pages?: never;
};

export type NumberedListResponse<T> = BaseListResponse<T> & {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
};

export type ListResponse<T> = CursorListResponse<T> | NumberedListResponse<T>;

export type DeleteResponse = {
  deleted: boolean;
  id: string;
};

export type CursorListParams = {
  after?: string;
  limit?: number;
  page?: never;
  per_page?: never;
};

export type NumberedListParams = {
  page: number;
  per_page?: number;
  after?: never;
  limit?: never;
};

export type ListParams = CursorListParams | NumberedListParams;

export type JsonPrimitive = boolean | null | number | string;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type Metadata = JsonObject;

export type Nullable<T> = T | null;

export type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
    param?: string;
    /** @deprecated The API uses `param`. */
    field?: string;
  };
  code?: string;
  message?: string;
  param?: string;
  /** @deprecated The API uses `param`. */
  field?: string;
};

export type ContentStatus = "draft" | "in_review" | "scheduled" | "published" | "archived";
export type PostFieldGroup = "summary" | "content" | "seo" | "workflow" | "metadata";
export type PostInclude = "authors" | "categories" | "tags" | "media" | "translations";
export type PostSort = "published_at" | "created_at" | "updated_at" | "relevance";
export type SortDirection = "asc" | "desc";
export type RelationMatch = "any" | "all";

export type SeoFields = {
  seo_title?: Nullable<string>;
  seo_description?: Nullable<string>;
  canonical_url?: Nullable<string>;
  focus_keyphrase?: Nullable<string>;
  seo_keywords?: string[];
  robots_index?: boolean;
  robots_follow?: boolean;
  open_graph_title?: Nullable<string>;
  open_graph_description?: Nullable<string>;
  open_graph_media_asset_id?: Nullable<string>;
  twitter_title?: Nullable<string>;
  twitter_description?: Nullable<string>;
  twitter_media_asset_id?: Nullable<string>;
  schema_type?: Nullable<string>;
};

export type SeoResponseFields = {
  seo_title: Nullable<string>;
  seo_description: Nullable<string>;
  canonical_url: Nullable<string>;
  focus_keyphrase: Nullable<string>;
  seo_keywords: string[];
  robots_index: boolean;
  robots_follow: boolean;
  open_graph_title: Nullable<string>;
  open_graph_description: Nullable<string>;
  open_graph_media_asset_id: Nullable<string>;
  twitter_title: Nullable<string>;
  twitter_description: Nullable<string>;
  twitter_media_asset_id: Nullable<string>;
  schema_type: string;
};

export type Author = {
  id: string;
  object: "author";
  organization_id: string;
  public_name: string;
  slug: string;
  bio: Nullable<string>;
  avatar_media_id: Nullable<string>;
  avatar_url: Nullable<string>;
  website_url: Nullable<string>;
  metadata: Metadata;
  created_at: string;
  updated_at: string;
};

export type CreateAuthorInput = {
  public_name: string;
  member_id?: Nullable<string>;
  slug?: string;
  bio?: Nullable<string>;
  avatar_media_id?: Nullable<string>;
  website_url?: Nullable<string>;
  metadata?: Metadata;
};

export type UpdateAuthorInput = Partial<CreateAuthorInput>;

export type MediaAsset = {
  id: string;
  object: "media_asset";
  organization_id: string;
  url: string;
  original_filename: Nullable<string>;
  alt_text: Nullable<string>;
  caption: Nullable<string>;
  mime_type: Nullable<string>;
  width: Nullable<number>;
  height: Nullable<number>;
  size_bytes: Nullable<number>;
  metadata: Metadata;
  created_at: string;
  updated_at: string;
};

export type UploadMediaInput = {
  file: Blob;
  filename?: string;
  alt_text?: Nullable<string>;
  caption?: Nullable<string>;
  metadata?: Metadata;
};

export type UpdateMediaInput = {
  alt_text?: Nullable<string>;
  caption?: Nullable<string>;
  metadata?: Metadata;
};

export type TaxonomyType = "category" | "tag";
export type TermInclude = "translations";

export type TaxonomyTerm = SeoResponseFields & {
  id: string;
  object: "taxonomy_term";
  organization_id: string;
  taxonomy_type: TaxonomyType;
  parent_taxonomy_term_id: Nullable<string>;
  locale: string;
  name: string;
  slug: string;
  description: Nullable<string>;
  metadata: Metadata;
  created_at: string;
  updated_at: string;
  translations?: Array<{
    id: string;
    locale: string;
    name: string;
    slug: string;
  }>;
};

export type CreateTermInput = SeoFields & {
  name: string;
  slug?: string;
  locale?: string;
  translation_of_id?: Nullable<string>;
  parent_taxonomy_term_id?: Nullable<string>;
  description?: Nullable<string>;
  metadata?: Metadata;
};

export type UpdateTermInput = Partial<CreateTermInput>;

export type TermListFilters = {
  locale?: string;
  include?: TermInclude | TermInclude[];
};

export type TermListParams = TermListFilters & ListParams;

export type Post = Partial<SeoResponseFields> & {
  id: string;
  object: "post";
  organization_id: string;
  content_type: "blog_post";
  locale: string;
  status?: ContentStatus;
  title?: string;
  slug?: string;
  is_featured?: boolean;
  excerpt?: Nullable<string>;
  body_markdown?: Nullable<string>;
  featured_media_asset_id?: Nullable<string>;
  media_asset_ids?: string[];
  published_at?: Nullable<string>;
  scheduled_at?: Nullable<string>;
  version?: number;
  metadata?: Metadata;
  created_at?: string;
  updated_at?: string;
  authors?: Author[];
  categories?: TaxonomyTerm[];
  tags?: TaxonomyTerm[];
  media?: MediaAsset[];
  translations?: Array<{
    id: string;
    locale: string;
    slug: string;
    status: ContentStatus;
  }>;
};

export type PostListFilters = {
  locale?: string;
  status?: ContentStatus;
  is_featured?: boolean;
  author_id?: string | string[];
  author_slug?: string | string[];
  author_match?: RelationMatch;
  exclude_author_id?: string | string[];
  exclude_author_slug?: string | string[];
  category_id?: string | string[];
  category_slug?: string | string[];
  category_match?: RelationMatch;
  exclude_category_id?: string | string[];
  exclude_category_slug?: string | string[];
  tag_id?: string | string[];
  tag_slug?: string | string[];
  tag_match?: RelationMatch;
  exclude_tag_id?: string | string[];
  exclude_tag_slug?: string | string[];
  search?: string;
  sort?: PostSort;
  direction?: SortDirection;
  fields?: PostFieldGroup | PostFieldGroup[];
  include?: PostInclude | PostInclude[];
};

export type PostListParams = PostListFilters & ListParams;

export type CreatePostInput = SeoFields & {
  title: string;
  slug?: string;
  locale?: string;
  translation_of_id?: Nullable<string>;
  status?: ContentStatus;
  is_featured?: boolean;
  excerpt?: Nullable<string>;
  body_markdown?: Nullable<string>;
  featured_media_asset_id?: Nullable<string>;
  media_asset_ids?: string[];
  published_at?: Nullable<string>;
  scheduled_at?: Nullable<string>;
  metadata?: Metadata;
  author_profile_ids?: string[];
  category_ids?: string[];
  tag_ids?: string[];
};

export type UpdatePostInput = Partial<CreatePostInput> & {
  expected_version?: number;
};

export type PostGetParams = {
  locale?: string;
  fields?: PostFieldGroup | PostFieldGroup[];
  include?: PostInclude | PostInclude[];
};

export type PostRevisionSummary = {
  id: string;
  object: "post_revision";
  parent_post_id: string;
  title: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type PostRevision = PostRevisionSummary & {
  body_markdown: string;
};

export type PostRevisionListFilters = {
  locale?: string;
};

export type PostRevisionListParams = PostRevisionListFilters & ListParams;

export type PostRevisionGetParams = {
  locale?: string;
};

export type SlugRedirect = {
  object: "slug_redirect";
  content_type: "blog_post";
  locale: string;
  from_slug: string;
  to_slug: string;
  post_id: string;
  status_code: number;
};

export type SlugRedirectParams = {
  locale?: string;
};

export type SitemapParams = {
  locale?: string;
  limit?: number;
};

export type FeedParams = {
  locale?: string;
  limit?: number;
};

export type Locale = {
  tag: string;
  name: string;
  language: string;
  region: string;
};
