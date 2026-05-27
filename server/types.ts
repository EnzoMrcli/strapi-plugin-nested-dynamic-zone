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
