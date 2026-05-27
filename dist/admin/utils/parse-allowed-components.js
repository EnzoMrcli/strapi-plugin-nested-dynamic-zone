/**
 * Parse the `options.allowedComponents` value from a stored attribute.
 *
 * Tolerates THREE storage forms, in this order:
 *   1. A real string array — the cleanest form, written in hand-edited
 *      schema JSON files.
 *   2. A JSON-encoded array string `'["a","b"]'` — legacy compat from
 *      v1.0.0 / v1.0.1 where the option was declared as `type: 'json'`.
 *   3. A comma-separated string `'a, b'` — what the Content-Type Builder
 *      form produces since v1.0.2 (Strapi v5 CTB rejected `type: 'json'`
 *      option inputs in some patch releases).
 *
 * Duplicated from server/types.ts to keep the admin bundle independent.
 */
export function parseAllowedComponents(value) {
    if (Array.isArray(value)) {
        return value.filter((v) => typeof v === 'string' && v.length > 0);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed)
            return [];
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.filter((v) => typeof v === 'string' && v.length > 0);
                }
            }
            catch {
                // Fall through to CSV parsing.
            }
        }
        return trimmed
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }
    return [];
}
//# sourceMappingURL=parse-allowed-components.js.map