/**
 * Component-schema loader for the admin UI.
 * Caches promises so concurrent calls for the same UID coalesce.
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
export declare function _resetSchemaCache(): void;
export {};
//# sourceMappingURL=schema-loader.d.ts.map