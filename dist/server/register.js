"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const isNdz = (attr) => attr?.type === 'customField' && attr?.customField === types_1.FIELD_ID;
function detectCycle(strapi) {
    const components = strapi.components;
    if (!components)
        return null;
    // 3-colour DFS: not-in-map = white (unvisited), GRAY = on stack, BLACK = done
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map();
    function visit(uid, stack) {
        if (color.get(uid) === GRAY)
            return [...stack, uid];
        if (color.get(uid) === BLACK)
            return null;
        color.set(uid, GRAY);
        const schema = components[uid];
        if (schema) {
            for (const attr of Object.values(schema.attributes ?? {})) {
                const targets = [];
                if (isNdz(attr))
                    targets.push(...(0, types_1.parseAllowedComponents)(attr.options?.allowedComponents));
                if (attr.type === 'component' && typeof attr.component === 'string')
                    targets.push(attr.component);
                for (const next of targets) {
                    const cycle = visit(next, [...stack, uid]);
                    if (cycle)
                        return cycle;
                }
            }
        }
        color.set(uid, BLACK);
        return null;
    }
    for (const uid of Object.keys(components)) {
        const cycle = visit(uid, []);
        if (cycle)
            return cycle;
    }
    return null;
}
exports.default = ({ strapi }) => {
    strapi.customFields.register({
        name: types_1.FIELD_NAME,
        plugin: types_1.PLUGIN_NAME,
        type: 'json',
        inputSize: { default: 12, isResizable: false },
    });
    try {
        const cycle = detectCycle(strapi);
        if (cycle) {
            strapi.log.error(`[${types_1.PLUGIN_NAME}] schema cycle detected: ${cycle.join(' -> ')}. ` +
                'Break the cycle by removing one of the entries from allowedComponents.');
        }
    }
    catch {
        // Not fatal — bootstrap re-runs this check once everything is loaded.
    }
};
//# sourceMappingURL=register.js.map