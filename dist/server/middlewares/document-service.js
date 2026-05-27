"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
exports.default = ({ strapi, validator, serializer }) => {
    const components = strapi.components;
    const contentTypes = strapi.contentTypes;
    const lookupSchema = (uid) => contentTypes?.[uid] ?? components?.[uid];
    async function walkAndProcess(data, schema, onNdz) {
        if (!data || typeof data !== 'object' || Array.isArray(data) || !schema)
            return;
        const obj = data;
        for (const [key, raw] of Object.entries(schema.attributes ?? {})) {
            const attr = raw;
            if (attr.customField === types_1.FIELD_ID) {
                if (key in obj) {
                    obj[key] = await onNdz(obj[key], attr);
                }
                continue;
            }
            if (attr.type === 'component' && typeof attr.component === 'string') {
                const childSchema = components?.[attr.component];
                const child = obj[key];
                if (Array.isArray(child)) {
                    for (const c of child)
                        await walkAndProcess(c, childSchema, onNdz);
                }
                else if (child && typeof child === 'object') {
                    await walkAndProcess(child, childSchema, onNdz);
                }
                continue;
            }
            if (attr.type === 'dynamiczone' && Array.isArray(obj[key])) {
                for (const item of obj[key]) {
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
        if (WRITE_ACTIONS.has(ctx.action) && ctx.params?.data) {
            const data = ctx.params.data;
            await walkAndProcess(data, schema, async (value, attr) => {
                return validator.validate(value, attr);
            });
        }
        const result = await next();
        if (READ_ACTIONS.has(ctx.action) && result && schema) {
            const normalize = (node) => {
                walkResult(node, schema, components ?? {}, serializer);
            };
            if (Array.isArray(result))
                result.forEach(normalize);
            else
                normalize(result);
        }
        return result;
    });
    strapi.log.info('[nested-dynamic-zone] document-service middleware installed');
};
function walkResult(node, schema, components, serializer) {
    if (!node || typeof node !== 'object')
        return;
    serializer.normalize(node, schema);
    const obj = node;
    for (const [key, attr] of Object.entries(schema.attributes ?? {})) {
        const a = attr;
        if (a.type === 'component' && typeof a.component === 'string') {
            const child = obj[key];
            const childSchema = components[a.component];
            if (!childSchema)
                continue;
            if (Array.isArray(child))
                child.forEach((c) => walkResult(c, childSchema, components, serializer));
            else
                walkResult(child, childSchema, components, serializer);
        }
        else if (a.type === 'dynamiczone' && Array.isArray(obj[key])) {
            for (const item of obj[key]) {
                const uid = item?.__component;
                if (typeof uid === 'string') {
                    const childSchema = components[uid];
                    if (childSchema)
                        walkResult(item, childSchema, components, serializer);
                }
            }
        }
    }
}
//# sourceMappingURL=document-service.js.map