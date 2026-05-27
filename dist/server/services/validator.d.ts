/**
 * NDZ validator service.
 *
 * Public surface:
 *   isNdzAttribute(attr)   — type guard
 *   validate(value, attr)  — validates an NDZ array against its schema,
 *                            returns a sanitized copy, throws ValidationError
 */
import type { Core } from '@strapi/strapi';
import { AttributeLike, NdzAttribute, NdzItem } from '../types';
export interface ValidatorService {
    isNdzAttribute(attr: AttributeLike | undefined): attr is NdzAttribute;
    validate(value: unknown, attr: NdzAttribute, options?: ValidateOptions): Promise<NdzItem[]>;
}
export interface ValidateOptions {
    depth?: number;
    maxDepth?: number;
    path?: string[];
}
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => ValidatorService;
export default _default;
//# sourceMappingURL=validator.d.ts.map