/**
 * Component-schema loader for the admin UI.
 *
 * Endpoint priority:
 *   1. `GET /content-type-builder/components/:uid`
 *        Returns the full schema with `attributes`. This is what we
 *        actually need to render a sub-form. Shape:
 *          { data: { uid, category, apiId, schema: {
 *              displayName, attributes: { fieldName: { type, ... } }, ...
 *          } } }
 *
 *   2. `GET /content-manager/components/:uid/configuration` (fallback)
 *        Returns the Content Manager UI layout — `metadatas`, `layouts`,
 *        `settings`. Does NOT contain attribute types, so it's only
 *        useful as a fallback to extract display info; if we ever land
 *        here we have no choice but to fail loudly because attributes
 *        are missing.
 *
 * Promises are cached per-uid so concurrent calls coalesce.
 */
const cache = new Map();
/**
 * Pull a usable ComponentSchema out of a Strapi response.
 *
 * We accept four shapes in priority order:
 *   1. CTB:  { data: { uid, schema: { displayName, attributes, ... } } }
 *   2. CTB legacy: { data: { uid, attributes, ... } }
 *   3. CM configuration: { data: { component: { ... } } } — only useful
 *      if `attributes` were unexpectedly included.
 *   4. Raw schema object passed directly.
 *
 * We REQUIRE `attributes` to be present and an object. Anything else
 * throws — it's better to surface a clear error than to render a
 * half-broken form.
 */
function unwrap(body) {
    const b = body;
    const data = b?.data ?? body;
    const d = data;
    // Shape 1: CTB current — { data: { uid, schema: { attributes, ... } } }
    if (d?.schema && typeof d.schema === 'object') {
        const s = d.schema;
        if (s.attributes && typeof s.attributes === 'object') {
            return {
                uid: typeof d.uid === 'string' ? d.uid : '',
                attributes: s.attributes,
                info: {
                    displayName: typeof s.displayName === 'string' ? s.displayName : undefined,
                    description: typeof s.description === 'string' ? s.description : undefined,
                    icon: typeof s.icon === 'string' ? s.icon : undefined,
                },
            };
        }
    }
    // Shape 2: CTB legacy — { data: { uid, attributes, ... } }
    if (d?.attributes && typeof d.attributes === 'object') {
        return {
            uid: typeof d.uid === 'string' ? d.uid : '',
            attributes: d.attributes,
            info: typeof d.info === 'object' && d.info !== null ? d.info : undefined,
        };
    }
    // Shape 3: CM configuration — usually has no attributes, but check anyway.
    if (d?.component && typeof d.component === 'object') {
        const c = d.component;
        if (c.attributes && typeof c.attributes === 'object') {
            return {
                uid: typeof c.uid === 'string' ? c.uid : '',
                attributes: c.attributes,
            };
        }
    }
    throw new Error('Unrecognized component schema response shape — `attributes` not found. ' +
        'Make sure the admin user has access to the /content-type-builder API.');
}
export function loadComponentSchema(uid, client) {
    let cached = cache.get(uid);
    if (cached)
        return cached;
    cached = client
        .get(`/content-type-builder/components/${uid}`)
        .then((res) => unwrap(res.data))
        .catch(async (err) => {
        // CTB endpoint may be restricted in some hardened setups. Fall back
        // to the Content Manager configuration endpoint (rarely useful for
        // attributes, but worth a try before giving up).
        try {
            const res = await client.get(`/content-manager/components/${uid}/configuration`);
            return unwrap(res.data);
        }
        catch {
            throw err;
        }
    });
    cache.set(uid, cached);
    cached.catch(() => cache.delete(uid));
    return cached;
}
/** Test hook — clears the cache between renders / unit tests. */
export function _resetSchemaCache() {
    cache.clear();
}
//# sourceMappingURL=schema-loader.js.map