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
export declare function parseAllowedComponents(value: unknown): string[];
//# sourceMappingURL=parse-allowed-components.d.ts.map