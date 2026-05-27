"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Server module surface — what Strapi loads when the plugin boots.
 */
const register_1 = __importDefault(require("./register"));
const bootstrap_1 = __importDefault(require("./bootstrap"));
const validator_1 = __importDefault(require("./services/validator"));
const sanitizer_1 = __importDefault(require("./services/sanitizer"));
const serializer_1 = __importDefault(require("./services/serializer"));
const graphql_1 = __importDefault(require("./services/graphql"));
exports.default = {
    register: register_1.default,
    bootstrap: bootstrap_1.default,
    services: {
        validator: validator_1.default,
        sanitizer: sanitizer_1.default,
        serializer: serializer_1.default,
        graphql: graphql_1.default,
    },
    contentTypes: {},
    policies: {},
    routes: [],
    controllers: {},
};
//# sourceMappingURL=index.js.map