/**
 * NDZ validator service.
 *
 * Public surface:
 *   isNdzAttribute(attr)   — type guard
 *   validate(value, attr)  — validates an NDZ array against its schema,
 *                            returns a sanitized copy, throws ValidationError
 */
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';
import {
  AttributeLike,
  FIELD_ID,
  NdzAttribute,
  NdzItem,
  SchemaLike,
  parseAllowedComponents,
} from '../types';

const DEFAULT_MAX_DEPTH = 32;

export interface ValidatorService {
  isNdzAttribute(attr: AttributeLike | undefined): attr is NdzAttribute;
  validate(value: unknown, attr: NdzAttribute, options?: ValidateOptions): Promise<NdzItem[]>;
}

export interface ValidateOptions {
  depth?: number;
  maxDepth?: number;
  path?: string[];
}

export default ({ strapi }: { strapi: Core.Strapi }): ValidatorService => {
  const components = (strapi as unknown as {
    components: Record<string, SchemaLike>;
  }).components;

  return {
    isNdzAttribute(attr): attr is NdzAttribute {
      return attr?.type === 'customField' && attr?.customField === FIELD_ID;
    },

    async validate(value, attr, options = {}): Promise<NdzItem[]> {
      const depth = options.depth ?? 0;
      const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
      const path = options.path ?? [];

      if (depth > maxDepth) {
        throw new errors.ValidationError(
          `NDZ exceeds max nesting depth (${maxDepth}); check for accidental component recursion`,
        );
      }

      if (value == null) return [];

      if (!Array.isArray(value)) {
        throw new errors.ValidationError(
          `NDZ value must be an array, got ${typeof value}`,
        );
      }

      const min = attr.options?.min ?? 0;
      const max = attr.options?.max ?? Infinity;
      if (value.length < min) {
        throw new errors.ValidationError(`NDZ requires at least ${min} item(s)`);
      }
      if (value.length > max) {
        throw new errors.ValidationError(`NDZ allows at most ${max} item(s)`);
      }

      const allowed = new Set<string>(parseAllowedComponents(attr.options?.allowedComponents));
      const out: NdzItem[] = [];

      for (let i = 0; i < value.length; i++) {
        const raw = value[i];
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          throw new errors.ValidationError(`NDZ item ${i} is not an object`);
        }
        const item = raw as Record<string, unknown>;
        const uid = item.__component;
        if (typeof uid !== 'string' || !uid) {
          throw new errors.ValidationError(`NDZ item ${i}: missing __component`);
        }
        if (!allowed.has(uid)) {
          throw new errors.ValidationError(
            `NDZ item ${i}: __component "${uid}" is not in allowedComponents`,
          );
        }
        const schema = components?.[uid];
        if (!schema) {
          throw new errors.ValidationError(
            `NDZ item ${i}: unknown component "${uid}"`,
          );
        }

        // Whitelist-copy attribute by attribute.
        const cleaned: NdzItem = { __component: uid };
        for (const [key, sub] of Object.entries(schema.attributes ?? {})) {
          if (key === '__component' || key === 'id' || key === '__tempId') continue;
          const subValue = item[key];
          if (subValue === undefined) continue;
          if (this.isNdzAttribute(sub)) {
            cleaned[key] = await this.validate(subValue, sub as NdzAttribute, {
              depth: depth + 1,
              maxDepth,
              path: [...path, uid],
            });
          } else {
            cleaned[key] = subValue;
          }
        }
        out.push(cleaned);
      }

      return out;
    },
  };
};
