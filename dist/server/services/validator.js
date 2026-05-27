"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@strapi/utils");
const types_1 = require("../types");
const DEFAULT_MAX_DEPTH = 32;
exports.default = ({ strapi }) => {
    const components = strapi.components;
    return {
        isNdzAttribute(attr) {
            return attr?.type === 'customField' && attr?.customField === types_1.FIELD_ID;
        },
        async validate(value, attr, options = {}) {
            const depth = options.depth ?? 0;
            const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
            const path = options.path ?? [];
            if (depth > maxDepth) {
                throw new utils_1.errors.ValidationError(`NDZ exceeds max nesting depth (${maxDepth}); check for accidental component recursion`);
            }
            if (value == null)
                return [];
            if (!Array.isArray(value)) {
                throw new utils_1.errors.ValidationError(`NDZ value must be an array, got ${typeof value}`);
            }
            const min = attr.options?.min ?? 0;
            const max = attr.options?.max ?? Infinity;
            if (value.length < min) {
                throw new utils_1.errors.ValidationError(`NDZ requires at least ${min} item(s)`);
            }
            if (value.length > max) {
                throw new utils_1.errors.ValidationError(`NDZ allows at most ${max} item(s)`);
            }
            const allowed = new Set((0, types_1.parseAllowedComponents)(attr.options?.allowedComponents));
            const out = [];
            for (let i = 0; i < value.length; i++) {
                const raw = value[i];
                if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
                    throw new utils_1.errors.ValidationError(`NDZ item ${i} is not an object`);
                }
                const item = raw;
                const uid = item.__component;
                if (typeof uid !== 'string' || !uid) {
                    throw new utils_1.errors.ValidationError(`NDZ item ${i}: missing __component`);
                }
                if (!allowed.has(uid)) {
                    throw new utils_1.errors.ValidationError(`NDZ item ${i}: __component "${uid}" is not in allowedComponents`);
                }
                const schema = components?.[uid];
                if (!schema) {
                    throw new utils_1.errors.ValidationError(`NDZ item ${i}: unknown component "${uid}"`);
                }
                // Whitelist-copy attribute by attribute.
                const cleaned = { __component: uid };
                for (const [key, sub] of Object.entries(schema.attributes ?? {})) {
                    if (key === '__component' || key === 'id' || key === '__tempId')
                        continue;
                    const subValue = item[key];
                    if (subValue === undefined)
                        continue;
                    if (this.isNdzAttribute(sub)) {
                        cleaned[key] = await this.validate(subValue, sub, {
                            depth: depth + 1,
                            maxDepth,
                            path: [...path, uid],
                        });
                    }
                    else {
                        cleaned[key] = subValue;
                    }
                }
                out.push(cleaned);
            }
            return out;
        },
    };
};
//# sourceMappingURL=validator.js.map