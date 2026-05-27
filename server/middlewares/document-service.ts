/**
 * Document Service middleware.
 *
 * Intercepts every create/update/find on every content type. Validates NDZ
 * payloads on write; normalizes shape on read. Also walks nested component
 * instances inside the data tree so an NDZ inside a component inside a
 * content type works end-to-end.
 *
 * Dependencies (validator, serializer) are injected by bootstrap.ts as
 * explicit args — we deliberately do NOT look them up via
 * `strapi.plugin('nested-dynamic-zone').service(...)`, see bootstrap.ts
 * for the rationale.
 */
import type { Core } from '@strapi/strapi';
import { AttributeLike, FIELD_ID, NdzAttribute, SchemaLike } from '../types';
import type { ValidatorService } from '../services/validator';
import type { SerializerService } from '../services/serializer';

interface DocumentServiceMiddlewareArgs {
  strapi: Core.Strapi;
  validator: ValidatorService;
  serializer: SerializerService;
}

export default ({ strapi, validator, serializer }: DocumentServiceMiddlewareArgs) => {
  const components = (strapi as unknown as {
    components: Record<string, SchemaLike>;
  }).components;
  const contentTypes = (strapi as unknown as {
    contentTypes: Record<string, SchemaLike>;
  }).contentTypes;

  const lookupSchema = (uid: string): SchemaLike | undefined =>
    contentTypes?.[uid] ?? components?.[uid];

  async function walkAndProcess(
    data: unknown,
    schema: SchemaLike | undefined,
    onNdz: (value: unknown, attr: NdzAttribute) => Promise<unknown>,
  ): Promise<void> {
    if (!data || typeof data !== 'object' || Array.isArray(data) || !schema) return;
    const obj = data as Record<string, unknown>;
    for (const [key, raw] of Object.entries(schema.attributes ?? {})) {
      const attr = raw as AttributeLike;

      if (attr.customField === FIELD_ID) {
        if (key in obj) {
          obj[key] = await onNdz(obj[key], attr as NdzAttribute);
        }
        continue;
      }

      if (attr.type === 'component' && typeof attr.component === 'string') {
        const childSchema = components?.[attr.component];
        const child = obj[key];
        if (Array.isArray(child)) {
          for (const c of child) await walkAndProcess(c, childSchema, onNdz);
        } else if (child && typeof child === 'object') {
          await walkAndProcess(child, childSchema, onNdz);
        }
        continue;
      }

      if (attr.type === 'dynamiczone' && Array.isArray(obj[key])) {
        for (const item of obj[key] as Array<Record<string, unknown>>) {
          const uid = item?.__component;
          if (typeof uid === 'string') {
            const childSchema = components?.[uid];
            await walkAndProcess(item, childSchema, onNdz);
          }
        }
      }
    }
  }

  const WRITE_ACTIONS = new Set([
    'create',
    'update',
    'publish',
    'unpublish',
    'discardDraft',
  ]);
  const READ_ACTIONS = new Set([
    'findOne',
    'findFirst',
    'findMany',
    'count',
    'create',
    'update',
    'publish',
  ]);

  strapi.documents.use(async (ctx, next) => {
    const uid = ctx.uid;
    const schema = lookupSchema(uid);

    if (WRITE_ACTIONS.has(ctx.action) && (ctx.params as { data?: unknown })?.data) {
      const data = (ctx.params as { data: unknown }).data;
      await walkAndProcess(data, schema, async (value, attr) => {
        return validator.validate(value, attr);
      });
    }

    const result = await next();

    if (READ_ACTIONS.has(ctx.action) && result && schema) {
      const normalize = (node: unknown) => {
        walkResult(node, schema, components ?? {}, serializer);
      };
      if (Array.isArray(result)) result.forEach(normalize);
      else normalize(result);
    }
    return result;
  });

  strapi.log.info('[nested-dynamic-zone] document-service middleware installed');
};

function walkResult(
  node: unknown,
  schema: SchemaLike,
  components: Record<string, SchemaLike>,
  serializer: SerializerService,
): void {
  if (!node || typeof node !== 'object') return;
  serializer.normalize(node, schema);
  const obj = node as Record<string, unknown>;
  for (const [key, attr] of Object.entries(schema.attributes ?? {})) {
    const a = attr as AttributeLike;
    if (a.type === 'component' && typeof a.component === 'string') {
      const child = obj[key];
      const childSchema = components[a.component];
      if (!childSchema) continue;
      if (Array.isArray(child)) child.forEach((c) => walkResult(c, childSchema, components, serializer));
      else walkResult(child, childSchema, components, serializer);
    } else if (a.type === 'dynamiczone' && Array.isArray(obj[key])) {
      for (const item of obj[key] as Array<Record<string, unknown>>) {
        const uid = item?.__component;
        if (typeof uid === 'string') {
          const childSchema = components[uid];
          if (childSchema) walkResult(item, childSchema, components, serializer);
        }
      }
    }
  }
}
