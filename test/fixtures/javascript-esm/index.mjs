import assert from "node:assert/strict";

import { CliBlog, CliBlogError } from "@cli-blog/node";

const requests = [];
const blog = new CliBlog({
  apiKey: "<public-api-key>",
  apiUrl: "https://api.example.com",
  fetch: async (input, init) => {
    requests.push({ init, input: String(input) });
    const body = String(input).includes("page=")
      ? { data: [], has_more: false, next_cursor: null, object: "list", page: 1, per_page: 10, total_items: 0, total_pages: 0 }
      : { data: [], has_more: false, next_cursor: null, object: "list" };
    return new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
    });
  },
});

const page = await blog.posts.list({
  author_match: "all",
  exclude_tag_slug: ["internal", "draft"],
  fields: ["summary"],
});

assert.equal(page.object, "list");
assert.equal(page.has_more, false);
const numbered = await blog.posts.list({ page: 1, per_page: 10 });
assert.equal(numbered.total_items, 0);
assert.match(requests[0].input, /author_match=all/);
assert.match(requests[0].input, /exclude_tag_slug=internal%2Cdraft/);
assert.match(requests[1].input, /page=1/);
assert.match(requests[1].input, /per_page=10/);
assert.equal(CliBlogError.name, "CliBlogError");
