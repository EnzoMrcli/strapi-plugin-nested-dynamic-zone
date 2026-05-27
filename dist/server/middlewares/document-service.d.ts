/**
 * Document Service middleware.
 *
 * Intercepts every create/update/find on every content type. Validates NDZ
 * payloads on write; normalizes shape on read. Also walks nested component
 * instances inside the data tree so an NDZ inside a component inside a
 * content type works end-to-end.
 *
 * Dependencies (validator, serializer) are injected by bootstrap.ts as
 * explicit args — we deliberately do NOT look them up via
 * `strapi.plugin('nested-dynamic-zone').service(...)`, see bootstrap.ts
 * for the rationale.
 */
import type { Core } from '@strapi/strapi';
import type { ValidatorService } from '../services/validator';
import type { SerializerService } from '../services/serializer';
interface DocumentServiceMiddlewareArgs {
    strapi: Core.Strapi;
    validator: ValidatorService;
    serializer: SerializerService;
}
declare const _default: ({ strapi, validator, serializer }: DocumentServiceMiddlewareArgs) => void;
export default _default;
//# sourceMappingURL=document-service.d.ts.map