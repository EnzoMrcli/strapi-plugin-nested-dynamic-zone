/**
 * Shared types used across the server modules.
 */
export declare const PLUGIN_NAME = "nested-dynamic-zone";
export declare const FIELD_NAME = "nested-dynamic-zone";
export declare const FIELD_ID: "plugin::nested-dynamic-zone.nested-dynamic-zone";
export interface NdzOptions {
    allowedComponents?: string[];
    min?: number;
    max?: number;
    /** Index signature lets NdzAttribute remain assignable to AttributeLike. */
    [key: string]: unknown;
}
export interface NdzAttribute {
    type: 'customField';
    customField: typeof FIELD_ID;
    options?: NdzOptions;
    required?: boolean;
    pluginOptions?: Record<string, unknown>;
    /** Index signature lets NdzAttribute remain assignable to AttributeLike. */
    [key: string]: unknown;
}
export interface NdzItem {
    __component: string;
    [key: string]: unknown;
}
export interface SchemaLike {
    uid?: string;
    attributes: Record<string, AttributeLike>;
    modelName?: string;
    globalId?: string;
}
export interface AttributeLike {
    type: string;
    component?: string;
    components?: string[];
    customField?: string;
    options?: Record<string, unknown>;
    [key: string]: unknown;
}
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
export declare function parseAllowedComponents(value: unknown): string[];
//# sourceMappingURL=types.d.ts.map