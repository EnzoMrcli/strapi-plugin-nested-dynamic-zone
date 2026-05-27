/**
 * Component-schema loader for the admin UI.
 * Caches promises so concurrent calls for the same UID coalesce.
 */
const cache = new Map();
function unwrap(body) {
    const b = body;
    const data = b?.data ?? body;
    const d = data;
    if (d?.component && typeof d.component === 'object')
        return d.component;
    if (d?.contentType && typeof d.contentType === 'object')
        return d.contentType;
    if (d?.attributes)
        return d;
    throw new Error('Unrecognized component schema response shape');
}
export function loadComponentSchema(uid, client) {
    let cached = cache.get(uid);
    if (cached)
        return cached;
    cached = client
        .get(`/content-manager/components/${uid}/configuration`)
        .then((res) => unwrap(res.data))
        .catch(async (err) => {
        try {
            const res = await client.get(`/content-type-builder/components/${uid}`);
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
export function _resetSchemaCache() {
    cache.clear();
}
//# sourceMappingURL=schema-loader.js.map