/**
 * GraphQL schema extension factory.
 *
 * For every NDZ attribute we encounter at boot, we declare a GraphQL union
 * type whose members are the allowed component types, then patch the parent
 * type to expose `[Union!]` for that attribute.
 */
import type { Core } from '@strapi/strapi';
/** Convert "blocks.text" → "ComponentBlocksText" (Strapi's GraphQL convention). */
export declare const toGqlTypeName: (uid: string) => string;
/** Convert a content-type UID like "api::page.page" to its GraphQL type name. */
export declare const contentTypeToGqlName: (uid: string) => string;
interface NdzFieldRef {
    parentUid: string;
    parentGqlType: string;
    attrKey: string;
    allowedComponents: string[];
    unionName: string;
}
export declare function collectNdzFields(strapi: Core.Strapi): NdzFieldRef[];
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    apply(): void;
};
export default _default;
//# sourceMappingURL=graphql.d.ts.map