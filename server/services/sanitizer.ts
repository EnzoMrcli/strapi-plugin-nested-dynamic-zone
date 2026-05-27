/**
 * Output sanitizer — strips internal-only fields (__tempId etc.) from
 * NDZ items before they leave the API.
 */
import type { Core } from '@strapi/strapi';
import { AttributeLike, FIELD_ID, NdzItem, SchemaLike, parseAllowedComponents } from '../types';

const INTERNAL_KEYS = new Set(['__tempId']);

export interface SanitizerService {
  sanitizeNdzArray(items: unknown, allowed: Set<string>): NdzItem[];
  sanitizeNode(node: unknown, schema: SchemaLike): void;
}

export default ({ strapi }: { strapi: Core.Strapi }): SanitizerService => {
  const components = (strapi as unknown as { components: Record<string, SchemaLike> }).components;

  const self: SanitizerService = {
    sanitizeNdzArray(items, allowed): NdzItem[] {
      if (!Array.isArray(items)) return [];
      const out: NdzItem[] = [];
      for (const raw of items) {
        if (!raw || typeof raw !== 'object') continue;
        const item = raw as Record<string, unknown>;
        const uid = item.__component;
        if (typeof uid !== 'string' || !allowed.has(uid)) continue;
        const clean: NdzItem = { __component: uid };
        for (const [k, v] of Object.entries(item)) {
          if (k === '__component') continue;
          if (INTERNAL_KEYS.has(k)) continue;
          clean[k] = v;
        }
        const childSchema = components?.[uid];
        if (childSchema) self.sanitizeNode(clean, childSchema);
        out.push(clean);
      }
      return out;
    },

    sanitizeNode(node, schema): void {
      if (!node || typeof node !== 'object') return;
      const obj = node as Record<string, unknown>;
      for (const [key, attr] of Object.entries(schema.attributes ?? {})) {
        const a = attr as AttributeLike;
        if (a.customField === FIELD_ID) {
          const allowed = new Set<string>(
            parseAllowedComponents(a.options?.allowedComponents),
          );
          obj[key] = self.sanitizeNdzArray(obj[key], allowed);
        }
      }
    },
  };

  return self;
};
