"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const INTERNAL_KEYS = new Set(['__tempId']);
exports.default = ({ strapi }) => {
    const components = strapi.components;
    const self = {
        sanitizeNdzArray(items, allowed) {
            if (!Array.isArray(items))
                return [];
            const out = [];
            for (const raw of items) {
                if (!raw || typeof raw !== 'object')
                    continue;
                const item = raw;
                const uid = item.__component;
                if (typeof uid !== 'string' || !allowed.has(uid))
                    continue;
                const clean = { __component: uid };
                for (const [k, v] of Object.entries(item)) {
                    if (k === '__component')
                        continue;
                    if (INTERNAL_KEYS.has(k))
                        continue;
                    clean[k] = v;
                }
                const childSchema = components?.[uid];
                if (childSchema)
                    self.sanitizeNode(clean, childSchema);
                out.push(clean);
            }
            return out;
        },
        sanitizeNode(node, schema) {
            if (!node || typeof node !== 'object')
                return;
            const obj = node;
            for (const [key, attr] of Object.entries(schema.attributes ?? {})) {
                const a = attr;
                if (a.customField === types_1.FIELD_ID) {
                    const allowed = new Set((0, types_1.parseAllowedComponents)(a.options?.allowedComponents));
                    obj[key] = self.sanitizeNdzArray(obj[key], allowed);
                }
            }
        },
    };
    return self;
};
//# sourceMappingURL=sanitizer.js.map