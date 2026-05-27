/**
 * Output serializer — parses string-JSON columns, fills defaults, delegates
 * cleanup to the sanitizer.
 */
import type { Core } from '@strapi/strapi';
import { SchemaLike } from '../types';
export interface SerializerService {
    normalize(record: unknown, schema: SchemaLike): void;
}
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => SerializerService;
export default _default;
//# sourceMappingURL=serializer.d.ts.map