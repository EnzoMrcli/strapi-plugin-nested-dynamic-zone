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
export interface ComponentSchema {
    uid: string;
    attributes: Record<string, ComponentAttribute>;
    info?: {
        displayName?: string;
        description?: string;
        icon?: string;
    };
}
export interface ComponentAttribute {
    type: string;
    component?: string;
    components?: string[];
    customField?: string;
    options?: Record<string, unknown>;
    required?: boolean;
    default?: unknown;
    enum?: string[];
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    multiple?: boolean;
    [key: string]: unknown;
}
type FetchClient = {
    get: (url: string) => Promise<{
        data: unknown;
    }>;
};
export declare function loadComponentSchema(uid: string, client: FetchClient): Promise<ComponentSchema>;
/** Test hook — clears the cache between renders / unit tests. */
export declare function _resetSchemaCache(): void;
export {};
//# sourceMappingURL=schema-loader.d.ts.map