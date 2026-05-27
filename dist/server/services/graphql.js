"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentTypeToGqlName = exports.toGqlTypeName = void 0;
exports.collectNdzFields = collectNdzFields;
const types_1 = require("../types");
/** Convert "blocks.text" → "ComponentBlocksText" (Strapi's GraphQL convention). */
const toGqlTypeName = (uid) => 'Component' +
    uid
        .split('.')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
exports.toGqlTypeName = toGqlTypeName;
/** Convert a content-type UID like "api::page.page" to its GraphQL type name. */
const contentTypeToGqlName = (uid) => {
    const parts = uid.split('.');
    const last = parts[parts.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
};
exports.contentTypeToGqlName = contentTypeToGqlName;
function collectNdzFields(strapi) {
    const all = {
        ...strapi.contentTypes,
        ...strapi.components,
    };
    const refs = [];
    for (const [parentUid, schema] of Object.entries(all)) {
        const parentGqlType = parentUid.startsWith('api::')
            ? (0, exports.contentTypeToGqlName)(parentUid)
            : (0, exports.toGqlTypeName)(parentUid);
        for (const [attrKey, attr] of Object.entries(schema.attributes ?? {})) {
            const a = attr;
            if (a.customField !== types_1.FIELD_ID)
                continue;
            refs.push({
                parentUid,
                parentGqlType,
                attrKey,
                allowedComponents: (0, types_1.parseAllowedComponents)(a.options?.allowedComponents),
                unionName: `${parentGqlType}_${attrKey}_NDZ`,
            });
        }
    }
    return refs;
}
exports.default = ({ strapi }) => {
    return {
        apply() {
            const gqlPlugin = strapi.plugin('graphql');
            if (!gqlPlugin)
                return;
            const extensionService = gqlPlugin.service('extension');
            const refs = collectNdzFields(strapi);
            if (refs.length === 0)
                return;
            const typeDefs = [];
            const resolvers = {};
            for (const ref of refs) {
                const memberNames = ref.allowedComponents.map(exports.toGqlTypeName);
                const unionDef = `union ${ref.unionName} = ${memberNames.join(' | ')}`;
                const fieldDef = `
          extend type ${ref.parentGqlType} {
            ${ref.attrKey}: [${ref.unionName}!]
          }
        `;
                typeDefs.push(unionDef, fieldDef);
                const parentResolvers = resolvers[ref.parentGqlType] ?? {};
                parentResolvers[ref.attrKey] = (parent) => {
                    const raw = parent[ref.attrKey];
                    if (Array.isArray(raw))
                        return raw;
                    if (typeof raw === 'string') {
                        try {
                            return JSON.parse(raw);
                        }
                        catch {
                            return [];
                        }
                    }
                    return [];
                };
                resolvers[ref.parentGqlType] = parentResolvers;
                resolvers[ref.unionName] = {
                    __resolveType: (item) => (0, exports.toGqlTypeName)(item.__component),
                };
            }
            extensionService.use({
                typeDefs: typeDefs.join('\n'),
                resolvers,
            });
            strapi.log.info(`[nested-dynamic-zone] registered ${refs.length} GraphQL union(s)`);
        },
    };
};
//# sourceMappingURL=graphql.js.map