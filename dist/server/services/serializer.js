"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
const sanitizer_1 = __importDefault(require("./sanitizer"));
exports.default = ({ strapi, sanitizer }) => {
    // When Strapi's services registry calls this factory, it only passes
    // `{ strapi }`. Fall back to instantiating sanitizer ourselves so that
    // external callers using `strapi.plugin(...).service('serializer')`
    // still work.
    const resolvedSanitizer = sanitizer ?? (0, sanitizer_1.default)({ strapi });
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
                const allowed = new Set((0, types_1.parseAllowedComponents)(a.options?.allowedComponents));
                obj[key] = resolvedSanitizer.sanitizeNdzArray(value, allowed);
            }
        },
    };
};
//# sourceMappingURL=serializer.js.map