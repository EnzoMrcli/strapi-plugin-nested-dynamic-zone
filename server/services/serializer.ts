/**
 * Output serializer — parses string-JSON columns, fills defaults, and
 * delegates cleanup to the injected sanitizer.
 *
 * `sanitizer` is an EXPLICIT dependency (not looked up via
 * strapi.plugin(...).service(...)) so the factory works even when the
 * plugin's config key in the user's project doesn't match its canonical
 * name. See server/bootstrap.ts for the longer rationale.
 */
import type { Core } from '@strapi/strapi';
import { AttributeLike, FIELD_ID, SchemaLike } from '../types';
import type { SanitizerService } from './sanitizer';
import sanitizerFactory from './sanitizer';

export interface SerializerService {
  normalize(record: unknown, schema: SchemaLike): void;
}

export interface SerializerArgs {
  strapi: Core.Strapi;
  sanitizer?: SanitizerService;
}

export default ({ strapi, sanitizer }: SerializerArgs): SerializerService => {
  // When Strapi's services registry calls this factory, it only passes
  // `{ strapi }`. Fall back to instantiating sanitizer ourselves so that
  // external callers using `strapi.plugin(...).service('serializer')`
  // still work.
  const resolvedSanitizer: SanitizerService = sanitizer ?? sanitizerFactory({ strapi });

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
        obj[key] = resolvedSanitizer.sanitizeNdzArray(value, allowed);
      }
    },
  };
};
