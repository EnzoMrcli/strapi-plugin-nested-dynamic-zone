/**
 * GraphQL schema extension factory.
 *
 * For every NDZ attribute we encounter at boot, we declare a GraphQL union
 * type whose members are the allowed component types, then patch the parent
 * type to expose `[Union!]` for that attribute.
 */
import type { Core } from '@strapi/strapi';
import { AttributeLike, FIELD_ID, NdzItem, SchemaLike, parseAllowedComponents } from '../types';

/** Convert "blocks.text" → "ComponentBlocksText" (Strapi's GraphQL convention). */
export const toGqlTypeName = (uid: string): string =>
  'Component' +
  uid
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/** Convert a content-type UID like "api::page.page" to its GraphQL type name. */
export const contentTypeToGqlName = (uid: string): string => {
  const parts = uid.split('.');
  const last = parts[parts.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1);
};

interface NdzFieldRef {
  parentUid: string;
  parentGqlType: string;
  attrKey: string;
  allowedComponents: string[];
  unionName: string;
}

export function collectNdzFields(strapi: Core.Strapi): NdzFieldRef[] {
  const all = {
    ...(strapi as unknown as { contentTypes: Record<string, SchemaLike> }).contentTypes,
    ...(strapi as unknown as { components: Record<string, SchemaLike> }).components,
  };
  const refs: NdzFieldRef[] = [];
  for (const [parentUid, schema] of Object.entries(all)) {
    const parentGqlType = parentUid.startsWith('api::')
      ? contentTypeToGqlName(parentUid)
      : toGqlTypeName(parentUid);
    for (const [attrKey, attr] of Object.entries(schema.attributes ?? {})) {
      const a = attr as AttributeLike;
      if (a.customField !== FIELD_ID) continue;
      refs.push({
        parentUid,
        parentGqlType,
        attrKey,
        allowedComponents: parseAllowedComponents(a.options?.allowedComponents),
        unionName: `${parentGqlType}_${attrKey}_NDZ`,
      });
    }
  }
  return refs;
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
  return {
    apply(): void {
      const gqlPlugin = strapi.plugin('graphql');
      if (!gqlPlugin) return;
      const extensionService = gqlPlugin.service('extension') as {
        use: (factory: unknown) => void;
      };

      const refs = collectNdzFields(strapi);
      if (refs.length === 0) return;

      const typeDefs: string[] = [];
      const resolvers: Record<string, Record<string, unknown>> = {};

      for (const ref of refs) {
        const memberNames = ref.allowedComponents.map(toGqlTypeName);
        const unionDef = `union ${ref.unionName} = ${memberNames.join(' | ')}`;
        const fieldDef = `
          extend type ${ref.parentGqlType} {
            ${ref.attrKey}: [${ref.unionName}!]
          }
        `;
        typeDefs.push(unionDef, fieldDef);

        const parentResolvers = resolvers[ref.parentGqlType] ?? {};
        parentResolvers[ref.attrKey] = (parent: Record<string, unknown>) => {
          const raw = parent[ref.attrKey];
          if (Array.isArray(raw)) return raw;
          if (typeof raw === 'string') {
            try { return JSON.parse(raw); } catch { return []; }
          }
          return [];
        };
        resolvers[ref.parentGqlType] = parentResolvers;

        resolvers[ref.unionName] = {
          __resolveType: (item: NdzItem) => toGqlTypeName(item.__component),
        };
      }

      extensionService.use({
        typeDefs: typeDefs.join('\n'),
        resolvers,
      });

      strapi.log.info(
        `[nested-dynamic-zone] registered ${refs.length} GraphQL union(s)`,
      );
    },
  };
};
