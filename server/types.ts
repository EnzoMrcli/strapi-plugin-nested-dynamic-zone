/**
 * Shared types used across the server modules.
 */

export const PLUGIN_NAME = 'nested-dynamic-zone';
export const FIELD_NAME = 'nested-dynamic-zone';
export const FIELD_ID = `plugin::${PLUGIN_NAME}.${FIELD_NAME}` as const;

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
export function parseAllowedComponents(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((v): v is string => typeof v === 'string' && v.length > 0);
        }
      } catch {
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
