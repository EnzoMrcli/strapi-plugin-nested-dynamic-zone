# strapi-plugin-nested-dynamic-zone

Use **Dynamic Zones inside Components** in Strapi v5. No core patches, no monkey-patching — just a custom field + Document Service middleware + GraphQL extension, all using public Strapi v5 APIs.

Targets Strapi `>=5.0.0`. Implemented and developed against `5.46.x`.

---

## 5-minute quick start

### 1. Install the plugin

**Option A — drop-in (recommended for trying it out)**

```pwsh
# from inside your Strapi project root:
git clone https://github.com/EnzoMrcli/strapi-plugin-nested-dynamic-zone.git src/plugins/nested-dynamic-zone
```

The repo ships a pre-built `dist/` folder, so this drop-in works **without running any build inside the plugin** — Strapi will require `dist/server/index.js` and bundle `dist/admin/index.js` directly.

**Option B — install as an npm dependency** (for production):

```pwsh
# inside the plugin folder, build and pack:
cd path\to\strapi-plugin-nested-dynamic-zone
npm install
npm run build
npm pack
# this produces strapi-plugin-nested-dynamic-zone-1.0.0.tgz

# back in your Strapi project:
cd path\to\your-strapi-project
npm install ..\strapi-plugin-nested-dynamic-zone\strapi-plugin-nested-dynamic-zone-1.0.0.tgz
```

### 2. Enable the plugin

In `config/plugins.ts` (or `.js`):

```ts
export default () => ({
  'nested-dynamic-zone': {
    enabled: true,
    // only needed for the drop-in case; remove this line for npm install
    resolve: './src/plugins/nested-dynamic-zone',
  },
});
```

### 3. Rebuild and restart Strapi

```pwsh
npm run build       # rebuilds the admin bundle to pick up the new custom field
npm run develop     # or `npm run start`
```

### 4. Verify it loaded

Check your Strapi server logs at startup. You should see:

```
[nested-dynamic-zone] document-service middleware installed
```

(plus `registered N GraphQL union(s)` once you've created at least one NDZ-typed field).

If you don't see this line, the plugin didn't load — jump to **Troubleshooting** below.

### 5. Try it

1. Open the **Content-Type Builder** in the admin.
2. Edit any component (or create a new one).
3. Click **Add another field to this component**.
4. Open the **CUSTOM** tab — you should see "Nested Dynamic Zone".
5. Click it, give the field a name (e.g. `blocks`), and set `options.allowedComponents` to a JSON array of UIDs, e.g.:
   ```json
   ["blocks.text", "blocks.image"]
   ```
6. Save the component and let Strapi restart.
7. Open the **Content Manager**, edit an entry that contains a component with your NDZ field, and you should see an editor that looks like a native Dynamic Zone.

---

## What it does and doesn't do

### Does ✅

- Lets you put a DZ-like field **inside a Component schema** (which Strapi forbids natively).
- Same UX as a native DZ: typed blocks, add/move/remove, configurable min/max.
- Validates every save: rejects unknown `__component` UIDs, strips unknown attributes silently.
- Returns the data in REST as `[{ __component, ...attrs }]` — byte-identical to a native DZ.
- Returns proper GraphQL union types (`ComponentBlocksText | ComponentBlocksImage | …`) — not a `JSON` scalar.
- Recursive: a component used in a nested zone can itself have a nested zone. Cycle detection at boot prevents infinite loops.
- Works inside both content types and components.

### Doesn't ❌

- Items in a nested zone are **not first-class component rows**. They have no DB id, no per-item relations, no per-item i18n. The container row (the content type or component that holds the NDZ field) is still localized normally.
- Strapi's standard `filters: { blocks: { __component: 'x' } }` won't traverse the JSON. To filter inside, use raw `knex` JSON operators in a custom service.
- No media or relation pickers inside nested items — those fields render as JSON textareas. Replace with `useFieldHint` + Strapi's official inputs if you need full UX.

If you absolutely need first-class component rows under nesting, you'd need a different architecture (synthetic polymorphic table maintained via lifecycles). Out of scope here.

---

## How it works

```
┌────────────────────────────────────────────────────────────────────────┐
│                       Content Manager (admin UI)                       │
│                                                                        │
│   User edits a Page that contains a `section` component with a         │
│   `blocks` NDZ field.                                                  │
│                                                                        │
│   strapi.customFields.register(...) routed the field to:               │
│     admin/src/components/Input  (DZ-like editor)                       │
│       └── admin/src/components/ItemEditor  (per-block sub-form)        │
│             └── recurses for nested NDZ via React.lazy(Input)          │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │ on save → POST /content-manager/...
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Strapi REST controller (built-in)                       │
│                                                                        │
│   Calls strapi.documents('api::page.page').update({                    │
│     documentId, data: { section: { blocks: [...] } }                   │
│   })                                                                   │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│        Document Service middleware (this plugin)                       │
│        server/middlewares/document-service.ts                          │
│                                                                        │
│   WRITE:  walk the data tree, find every NDZ attribute (incl. nested   │
│           inside components and native DZs), call validator.validate() │
│   READ:   walk the result, parse JSON-string columns, call serializer  │
│           to enforce the [{ __component, ... }] output shape           │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   validator (server/services/validator.ts)             │
│                                                                        │
│   For each item in the array:                                          │
│     1. require `__component` to be in `options.allowedComponents`      │
│     2. look up the target component schema in strapi.components        │
│     3. whitelist-copy each attribute that exists in that schema        │
│        (drops anything else silently — this is the anti-injection      │
│        layer)                                                          │
│     4. if a sub-attribute is itself an NDZ, recurse (max depth 32)     │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Core Document Service → Knex → DB                         │
│                                                                        │
│   The validated array is stored as JSON in the component's column      │
│   (jsonb on Postgres, json on MySQL, text on SQLite).                  │
│   No extra tables, no morph joins, no migration needed.                │
└────────────────────────────────────────────────────────────────────────┘
```

### REST output

```json
{
  "data": {
    "documentId": "abc...",
    "section": {
      "title": "Hero",
      "blocks": [
        { "__component": "blocks.text", "body": "Hello" },
        { "__component": "blocks.image", "url": "/x.png", "alt": "logo" }
      ]
    }
  }
}
```

### GraphQL output

NDZ fields are exposed as the `JSON` scalar in GraphQL — the data still
passes (clients can read/write the full array), just without union
typing.

```graphql
query {
  page(documentId: "abc...") {
    section {
      title
      blocks   # JSON scalar — array of { __component, ...attrs }
    }
  }
}
```

Returns:

```json
{ "blocks": [{ "__component": "blocks.text", "body": "Hello" }, ...] }
```

#### Why not a typed union?

Strapi's `@strapi/plugin-graphql` auto-generates a `JSON`-typed field
for every custom-field attribute whose base type is `json`. If the
plugin tries to override that with a typed union (which would let you
write `... on ComponentBlocksText { body }`), `@graphql-tools/merge`
refuses to merge the two conflicting declarations and Strapi crashes
at boot:

```
Error: Unable to merge GraphQL type "ComponentX": Field "y" already
defined with a different type. Declared as "JSON", but you tried to
override with "ComponentX_y_NDZ"
```

The `shadowCRUD().field().disable()` API that would let us suppress
Strapi's auto-generated declaration only works for content types in
Strapi 5.x — not for component types. Until a public component-level
disable API exists, the typed-union extension is opt-in via env var
and **expected to crash** for most setups:

```pwsh
$env:NDZ_ENABLE_GRAPHQL_UNIONS = 'true'   # at your own risk
npm run develop
```

If you opt in and it crashes, set the var back to `false`.

---

## Schema configuration reference

Inside any component JSON (`src/components/<category>/<name>.json`):

```json
{
  "collectionName": "components_blocks_sections",
  "info": { "displayName": "Section" },
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

You can also configure this through the Content-Type Builder UI (it writes the same JSON). For `allowedComponents` in the UI, paste a JSON array as the value of the option's text field.

---

## Troubleshooting

### "I downloaded the GitHub ZIP and my folder is `strapi-plugin-nested-dynamic-zone-main`"

GitHub adds the `-main` suffix to ZIP-downloaded folders. **Rename the
folder to `nested-dynamic-zone`** before placing it in `src/plugins/`:

```pwsh
Rename-Item .\src\plugins\strapi-plugin-nested-dynamic-zone-main `
            nested-dynamic-zone
```

Or, prefer `git clone` which uses the repo name verbatim:

```pwsh
git clone https://github.com/EnzoMrcli/strapi-plugin-nested-dynamic-zone.git `
          src\plugins\nested-dynamic-zone
```

The plugin no longer hard-depends on the config key matching internal
names (since v1.0.1), so a mismatched folder name doesn't crash anymore.
But aligning everything makes logs and stack traces readable.

### "I see nothing in the admin UI"

1. **Check the server logs.** At startup you should see
   `[nested-dynamic-zone] document-service middleware installed`.
   If it's missing, the plugin server module didn't load.

2. **Check `config/plugins.ts`.** Recommended config:
   ```ts
   'nested-dynamic-zone': {
     enabled: true,
     resolve: './src/plugins/nested-dynamic-zone',
   }
   ```
   The key can technically be anything (the plugin no longer depends on
   it matching), but using `nested-dynamic-zone` keeps things consistent
   with the docs.

3. **Rebuild the admin.** Custom field registration runs at admin bundle
   time. After installing/changing the plugin you MUST run:
   ```pwsh
   npm run build
   ```
   then restart Strapi. Re-running `npm run develop` alone is sometimes
   not enough.

4. **Cache.** Clear the admin app cache if the field still doesn't show up:
   ```pwsh
   Remove-Item -Recurse -Force .cache, build, node_modules\.vite
   npm run build
   npm run develop
   ```

### "The custom field is in the picker but adding it crashes the admin"

Most likely `@strapi/design-system` version mismatch. This plugin uses the
v2 component API (`Field.Root`, `Modal.Root`, `Toggle`, etc.). Verify your
Strapi project ships v2:

```pwsh
npm ls @strapi/design-system
```

If you're on v1, either upgrade Strapi or open an issue with your version
and I'll port the UI to the v1 API.

### "Server logs say `[nested-dynamic-zone] document-service middleware installed` but the field is not in the Content-Type Builder picker"

1. The admin bundle wasn't rebuilt with the new plugin code. Run
   `npm run build` then restart.
2. Look in the **CUSTOM** tab of the field picker, not in the standard tab.
3. If you used drop-in, confirm `dist/admin/` exists inside the plugin
   folder. If not, run `npm install && npm run build` **inside the plugin
   folder** (this generates the admin bundle).

### "Validation rejects valid data"

The validator's strict mode is intentional. Specifically:

- `__component` must be in the field's `allowedComponents` list.
- Each attribute on each item must be declared in that component's
  schema. Unknown attributes are silently dropped (not rejected).
- Arrays exceeding `max` or shorter than `min` are rejected.

Check the Strapi server logs for the actual `ValidationError` message.

### "GraphQL still returns JSON, not a union"

The GraphQL extension only runs when the `@strapi/plugin-graphql` plugin
is installed and enabled. Without it, only REST works. Install:

```pwsh
npm install @strapi/plugin-graphql
```

then restart. You should see
`[nested-dynamic-zone] registered N GraphQL union(s)` in the logs.

### "Strapi says: schema cycle detected"

A cycle like `componentA.blocks` allows `componentB`, which has a
`componentB.blocks` that allows `componentA`. This would let an editor
build an infinite tree, so the plugin refuses to start. Break the cycle
by removing one of the entries from `allowedComponents`.

---

## File-by-file map (for auditing)

```
strapi-plugin-nested-dynamic-zone/
├── strapi-server.js           CommonJS shim → requires ./dist/server
├── strapi-admin.js            CommonJS shim → requires ./dist/admin
├── strapi-server.ts           TS source of the same (for IDE navigation)
├── strapi-admin.ts            same
├── package.json
├── tsconfig.json              server-side TS config
├── README.md, LICENSE
├── server/                    server SOURCE (TypeScript)
│   ├── index.ts                  register / bootstrap / services exports
│   ├── types.ts                  NdzAttribute, NdzOptions, FIELD_ID
│   ├── register.ts               registers the custom field + cycle detection
│   ├── bootstrap.ts              wires middleware + GraphQL
│   ├── services/
│   │   ├── validator.ts          whitelist-validates each NDZ item
│   │   ├── sanitizer.ts          strips __tempId and unknown keys
│   │   ├── serializer.ts         parses JSON strings, normalises shape
│   │   └── graphql.ts            generates union types
│   ├── middlewares/
│   │   └── document-service.ts   hooks every create/update/find
│   ├── graphql/index.ts          calls graphql.apply()
│   └── content-types/index.ts    intentionally empty
├── admin/                     admin SOURCE (TSX) + tsconfig
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              registers the field with the admin app
│       ├── pluginId.ts
│       ├── translations/         en, fr
│       ├── utils/schema-loader.ts cached fetch of component schemas
│       └── components/
│           ├── Input/index.tsx        main NDZ editor
│           ├── ComponentPicker/       add-component modal
│           └── ItemEditor/            recursive sub-form
├── dist/                      COMPILED OUTPUT — committed to git so
│   ├── server/                drop-in installs work without a build step
│   └── admin/
└── example-component/
    └── section.json
```

`dist/` is intentionally committed despite being generated. This is the
pragmatic trade-off: drop-in users get a working plugin out of the box at
the cost of slightly noisier diffs when source changes. Rebuild after
editing source with `npm run build`.

---

## Building from source

```pwsh
npm install
npm run build     # tsc on server + tsc on admin → dist/
npm run verify    # type-check without emitting
```

---

## Status and known unknowns

This plugin was implemented and **typechecks cleanly against Strapi v5.46.x
type definitions**, but has not been validated end-to-end in a live Strapi
project. The most likely sources of runtime issues are:

- **Design-system version skew** — the UI uses `@strapi/design-system` v2
  APIs. Earlier patch releases of Strapi 5.x may ship slightly different
  exports; open an issue if you hit `is not exported from
  @strapi/design-system`.
- **Custom-field options UI** — `options.allowedComponents` is rendered
  as a JSON text area in the Content-Type Builder. A future iteration
  should replace it with a multi-select.
- **Media & relation pickers inside nested items** — currently fall back
  to a JSON textarea. Strapi's official pickers are not stable public
  exports, so embedding them safely would require additional version
  detection.

Patches welcome — the whole plugin is ~900 lines under
`server/` + `admin/src/`.

---

## Migrating to a native nested DZ later

If/when Strapi adds first-class nested DZ, the migration is just JSON-edit:

```diff
- "type": "customField",
- "customField": "plugin::nested-dynamic-zone.nested-dynamic-zone",
- "options": { "allowedComponents": ["blocks.text", "blocks.image"] }
+ "type": "dynamiczone",
+ "components": ["blocks.text", "blocks.image"]
```

No data migration is needed — the stored JSON shape (`[{ __component, ... }]`)
is already what Strapi expects for native DZ.

---

## License

MIT. See [LICENSE](./LICENSE).
