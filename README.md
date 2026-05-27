# strapi-plugin-nested-dynamic-zone

Use Dynamic Zones inside Components in Strapi v5. Implemented as a **custom field** + **Document Service middleware** + **GraphQL extension** — no core patches.

Works with Strapi `>=5.0.0`, tested against `5.46.x`.

## Why

Strapi v5 forbids `type: "dynamiczone"` inside Component schemas. The schema validator throws, and the Content-Type Builder UI filters DZ out of the field picker when the parent is a component. This plugin sidesteps the limitation by registering a custom field whose stored shape is **byte-identical to a native Dynamic Zone** (`[{ __component, ...attrs }]`) and providing the editor UI, validation, and API serialization.

## What it does NOT do

- Items inside a nested zone are **not** real component rows. They have no DB id, no relations *from* them, and no per-item i18n. The container row is still localized.
- Strapi's standard `filters: { blocks: { __component: 'x' } }` doesn't traverse the JSON. Use raw `knex` JSON operators if you need to filter inside.

For 95% of "section / row / page-builder" use cases this is exactly what you want.

## Installation

### Option A — drop it into a Strapi project (no build needed)

```pwsh
cp -r .\strapi-plugin-nested-dynamic-zone <your-strapi>\src\plugins\nested-dynamic-zone
```

Then in `config/plugins.ts`:

```ts
export default () => ({
  'nested-dynamic-zone': {
    enabled: true,
    resolve: './src/plugins/nested-dynamic-zone',
  },
});
```

Rebuild the admin: `npm run build`.

### Option B — install as an npm package

From this folder:

```pwsh
npm run build
npm pack
# then in your Strapi project:
npm install ../strapi-plugin-nested-dynamic-zone/strapi-plugin-nested-dynamic-zone-1.0.0.tgz
```

`config/plugins.ts`:

```ts
export default () => ({ 'nested-dynamic-zone': { enabled: true } });
```

## Usage

Use it inside any component schema (or content type):

```json
// src/components/blocks/section.json
{
  "collectionName": "components_blocks_sections",
  "info": { "displayName": "Section" },
  "options": {},
  "attributes": {
    "title": { "type": "string" },
    "blocks": {
      "type": "customField",
      "customField": "plugin::nested-dynamic-zone.nested-dynamic-zone",
      "options": {
        "allowedComponents": ["blocks.text", "blocks.image", "blocks.cta"],
        "min": 0,
        "max": 50
      }
    }
  }
}
```

The plugin will:

- Render a DZ-like editor in Content Manager when editing `blocks`.
- Validate items against their target component schema on every create/update/publish.
- Strip unknown attributes silently.
- Reject items whose `__component` is not in `allowedComponents`.
- Return the data as `[{ __component, ... }]` in REST and as a real GraphQL union in GraphQL queries.

Nesting works recursively — a component used in a nested zone can itself have a nested zone field, to arbitrary depth (cycle-detected at boot).

## API output shape

### REST

```json
{
  "data": {
    "documentId": "abc...",
    "section": {
      "title": "Hero",
      "blocks": [
        { "__component": "blocks.text", "body": "Hello" },
        { "__component": "blocks.image", "url": "/x.png", "alt": "x" }
      ]
    }
  }
}
```

### GraphQL

```graphql
query {
  page(documentId: "abc...") {
    section {
      title
      blocks {
        __typename
        ... on ComponentBlocksText { body }
        ... on ComponentBlocksImage { url alt }
      }
    }
  }
}
```

The plugin auto-generates one union type per `(parent, attribute)` pair.

## Security and data integrity

- **Anti-injection**: every value that comes in is whitelisted attribute-by-attribute against the target component's schema. Unknown attributes are dropped, not echoed back.
- **No DB schema changes**: storage is a single `jsonb`/`json`/`text` column on the parent row.
- **Cycle detection**: at boot, refuses schemas where `A.blocks` allows `B` which allows `A` back.

## Migration to a native DZ later

If Strapi adds first-class nested DZ in a future release, migration is a one-liner per schema:

```diff
- "type": "customField",
- "customField": "plugin::nested-dynamic-zone.nested-dynamic-zone",
- "options": { "allowedComponents": ["blocks.text", "blocks.image"] }
+ "type": "dynamiczone",
+ "components": ["blocks.text", "blocks.image"]
```

No data migration is needed — the JSON shape matches the native DZ wire format.

## License

MIT. See [LICENSE](./LICENSE).
