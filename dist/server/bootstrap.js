"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const document_service_1 = __importDefault(require("./middlewares/document-service"));
const validator_1 = __importDefault(require("./services/validator"));
const sanitizer_1 = __importDefault(require("./services/sanitizer"));
const serializer_1 = __importDefault(require("./services/serializer"));
const graphql_1 = __importDefault(require("./services/graphql"));
exports.default = async ({ strapi }) => {
    const sanitizer = (0, sanitizer_1.default)({ strapi });
    const validator = (0, validator_1.default)({ strapi });
    const serializer = (0, serializer_1.default)({ strapi, sanitizer });
    const graphqlSvc = (0, graphql_1.default)({ strapi });
    (0, document_service_1.default)({ strapi, validator, serializer });
    graphqlSvc.apply();
};
//# sourceMappingURL=bootstrap.js.map