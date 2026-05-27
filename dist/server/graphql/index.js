"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = __importDefault(require("../services/graphql"));
exports.default = ({ strapi }) => {
    (0, graphql_1.default)({ strapi }).apply();
};
//# sourceMappingURL=index.js.map