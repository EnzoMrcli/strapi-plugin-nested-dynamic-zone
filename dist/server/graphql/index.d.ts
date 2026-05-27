/**
 * Direct-instantiation wrapper around the GraphQL service factory.
 *
 * Bootstrap calls `graphqlFactory({ strapi }).apply()` directly now and
 * doesn't go through this file. It remains for external consumers that
 * want a one-line "apply NDZ to GraphQL" hook.
 */
import type { Core } from '@strapi/strapi';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => void;
export default _default;
//# sourceMappingURL=index.d.ts.map