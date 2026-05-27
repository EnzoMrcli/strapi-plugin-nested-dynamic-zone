/**
 * Document Service middleware.
 *
 * Intercepts every create/update/find on every content type. Validates NDZ
 * payloads on write; normalizes shape on read. Also walks nested component
 * instances inside the data tree so an NDZ inside a component inside a
 * content type works end-to-end.
 */
import type { Core } from '@strapi/strapi';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => void;
export default _default;
//# sourceMappingURL=document-service.d.ts.map