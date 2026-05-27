"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const document_service_1 = __importDefault(require("./middlewares/document-service"));
const graphql_1 = __importDefault(require("./graphql"));
exports.default = async ({ strapi }) => {
    (0, document_service_1.default)({ strapi });
    (0, graphql_1.default)({ strapi });
};
//# sourceMappingURL=bootstrap.js.map