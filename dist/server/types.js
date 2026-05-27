"use strict";
/**
 * Shared types used across the server modules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIELD_ID = exports.FIELD_NAME = exports.PLUGIN_NAME = void 0;
exports.parseAllowedComponents = parseAllowedComponents;
exports.PLUGIN_NAME = 'nested-dynamic-zone';
exports.FIELD_NAME = 'nested-dynamic-zone';
exports.FIELD_ID = `plugin::${exports.PLUGIN_NAME}.${exports.FIELD_NAME}`;
/**
 * Parse the `options.allowedComponents` value into a string array.
 *
 * Two storage forms are accepted, in this order:
 *   1. A real array — what we wrote originally and what hand-edited
 *      schema JSON files typically contain.
 *   2. A string, either:
 *      - a JSON-encoded array `["a","b"]` (legacy compatibility), OR
 *      - a comma-separated list `"a, b"` (what the Content-Type Builder
 *        form produces since v1.0.2 — Strapi's CTB doesn't accept
 *        `type: 'json'` option inputs cleanly, so we use a plain string
 *        input and parse here).
 */
function parseAllowedComponents(value) {
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
//# sourceMappingURL=types.js.map