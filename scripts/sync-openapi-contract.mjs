import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const fixturePath = resolve(import.meta.dirname, "../test/openapi-contract.json");
const args = process.argv.slice(2);
const check = args.includes("--check");
const explicitSource = args.find((arg) => arg !== "--check");
const workspaceSource = resolve(import.meta.dirname, "../../../cli-blog-www/content/openapi/cli-blog-api.json");

const hasWorkspaceSource = await access(workspaceSource).then(
  () => true,
  () => false,
);
const source = explicitSource ?? process.env.CLI_BLOG_OPENAPI_SOURCE ?? (hasWorkspaceSource ? workspaceSource : "https://api.cli-blog.com/openapi/json");

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
};

const hash = (value) => createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");

const loadSpec = async () => {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`OpenAPI request failed with ${response.status}`);
    return response.json();
  }
  return JSON.parse(await readFile(resolve(source), "utf8"));
};

const keyType = (operation) => {
  if (operation["x-cli-blog-key-type"]) return operation["x-cli-blog-key-type"];
  return operation.description?.match(/^Key type: (none|public or private|private)\./)?.[1]?.replaceAll(" ", "-");
};

const schemaEntries = (content = {}) =>
  Object.entries(content)
    .map(([contentType, value]) => {
      const schema = value?.schema ?? null;
      return {
        content_type: contentType,
        properties: Object.keys(schema?.properties ?? {}).sort(),
        required: [...(schema?.required ?? [])].sort(),
        schema_hash: hash(schema),
      };
    })
    .sort((a, b) => a.content_type.localeCompare(b.content_type));

const spec = await loadSpec();
const operations = [];
for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const method of ["delete", "get", "patch", "post", "put"]) {
    const operation = pathItem[method];
    if (!operation) continue;
    operations.push({
      key_type: keyType(operation) ?? null,
      method: method.toUpperCase(),
      parameters: (operation.parameters ?? [])
        .map((parameter) => ({
          in: parameter.in,
          name: parameter.name,
          required: parameter.required ?? false,
          schema_hash: hash(parameter.schema ?? null),
        }))
        .sort((a, b) => `${a.in}:${a.name}`.localeCompare(`${b.in}:${b.name}`)),
      path,
      request_body: schemaEntries(operation.requestBody?.content),
      responses: Object.entries(operation.responses ?? {})
        .map(([status, response]) => ({ content: schemaEntries(response?.content), status }))
        .sort((a, b) => a.status.localeCompare(b.status)),
    });
  }
}
operations.sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));

const fixture = {
  contract_hash: hash(operations),
  generated_from: "Cli Blog public OpenAPI",
  operations,
};
const serialized = `${JSON.stringify(fixture, null, 2)}\n`;

if (check) {
  const existing = await readFile(fixturePath, "utf8");
  if (existing !== serialized) {
    throw new Error(`OpenAPI contract fixture is stale for ${source}. Run bun run contract:sync.`);
  }
  console.log(`OpenAPI contract fixture matches ${source}`);
} else {
  await writeFile(fixturePath, serialized);
  console.log(`Wrote ${fixturePath} from ${source}`);
}
