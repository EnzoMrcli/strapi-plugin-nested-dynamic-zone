/**
 * Output serializer — parses string-JSON columns, fills defaults, delegates
 * cleanup to the sanitizer.
 */
import type { Core } from '@strapi/strapi';
import { AttributeLike, FIELD_ID, SchemaLike } from '../types';

export interface SerializerService {
  normalize(record: unknown, schema: SchemaLike): void;
}

export default ({ strapi }: { strapi: Core.Strapi }): SerializerService => {
  const sanitizer = strapi.plugin('nested-dynamic-zone').service('sanitizer') as {
    sanitizeNdzArray(items: unknown, allowed: Set<string>): unknown;
  };

  return {
    normalize(record, schema): void {
      if (!record || typeof record !== 'object') return;
      const obj = record as Record<string, unknown>;
      for (const [key, attr] of Object.entries(schema.attributes ?? {})) {
        const a = attr as AttributeLike;
        if (a.customField !== FIELD_ID) continue;

        let value = obj[key];
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch {
            value = [];
          }
        }
        if (value == null) value = [];

        const allowed = new Set<string>(
          ((a.options?.allowedComponents as string[] | undefined) ?? []),
        );
        obj[key] = sanitizer.sanitizeNdzArray(value, allowed);
      }
    },
  };
};
