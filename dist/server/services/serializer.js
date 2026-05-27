"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
exports.default = ({ strapi }) => {
    const sanitizer = strapi.plugin('nested-dynamic-zone').service('sanitizer');
    return {
        normalize(record, schema) {
            if (!record || typeof record !== 'object')
                return;
            const obj = record;
            for (const [key, attr] of Object.entries(schema.attributes ?? {})) {
                const a = attr;
                if (a.customField !== types_1.FIELD_ID)
                    continue;
                let value = obj[key];
                if (typeof value === 'string') {
                    try {
                        value = JSON.parse(value);
                    }
                    catch {
                        value = [];
                    }
                }
                if (value == null)
                    value = [];
                const allowed = new Set((a.options?.allowedComponents ?? []));
                obj[key] = sanitizer.sanitizeNdzArray(value, allowed);
            }
        },
    };
};
//# sourceMappingURL=serializer.js.map