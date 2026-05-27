"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ({ strapi }) => {
    const factory = strapi.plugin('nested-dynamic-zone').service('graphql');
    factory.apply();
};
//# sourceMappingURL=index.js.map