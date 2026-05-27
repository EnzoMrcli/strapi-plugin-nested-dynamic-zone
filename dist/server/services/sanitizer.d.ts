/**
 * Output sanitizer — strips internal-only fields (__tempId etc.) from
 * NDZ items before they leave the API.
 */
import type { Core } from '@strapi/strapi';
import { NdzItem, SchemaLike } from '../types';
export interface SanitizerService {
    sanitizeNdzArray(items: unknown, allowed: Set<string>): NdzItem[];
    sanitizeNode(node: unknown, schema: SchemaLike): void;
}
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => SanitizerService;
export default _default;
//# sourceMappingURL=sanitizer.d.ts.map