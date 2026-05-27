/**
 * Register phase — runs synchronously, before any content type is loaded.
 *
 * Two things happen here:
 *   1. We register a custom field of base type `json`. The Content-Type
 *      Builder will then offer it inside the "Custom" tab — for both
 *      content types AND components.
 *   2. We detect direct schema-level cycles at boot.
 */
import type { Core } from '@strapi/strapi';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => void;
export default _default;
//# sourceMappingURL=register.d.ts.map