/**
 * Output serializer — parses string-JSON columns, fills defaults, and
 * delegates cleanup to the injected sanitizer.
 *
 * `sanitizer` is an EXPLICIT dependency (not looked up via
 * strapi.plugin(...).service(...)) so the factory works even when the
 * plugin's config key in the user's project doesn't match its canonical
 * name. See server/bootstrap.ts for the longer rationale.
 */
import type { Core } from '@strapi/strapi';
import { SchemaLike } from '../types';
import type { SanitizerService } from './sanitizer';
export interface SerializerService {
    normalize(record: unknown, schema: SchemaLike): void;
}
export interface SerializerArgs {
    strapi: Core.Strapi;
    sanitizer?: SanitizerService;
}
declare const _default: ({ strapi, sanitizer }: SerializerArgs) => SerializerService;
export default _default;
//# sourceMappingURL=serializer.d.ts.map