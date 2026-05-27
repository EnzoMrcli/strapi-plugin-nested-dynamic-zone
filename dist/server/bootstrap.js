"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const document_service_1 = __importDefault(require("./middlewares/document-service"));
const validator_1 = __importDefault(require("./services/validator"));
const sanitizer_1 = __importDefault(require("./services/sanitizer"));
const serializer_1 = __importDefault(require("./services/serializer"));
const graphql_1 = __importDefault(require("./services/graphql"));
exports.default = async ({ strapi }) => {
    const sanitizer = (0, sanitizer_1.default)({ strapi });
    const validator = (0, validator_1.default)({ strapi });
    const serializer = (0, serializer_1.default)({ strapi, sanitizer });
    (0, document_service_1.default)({ strapi, validator, serializer });
    // ---------------------------------------------------------------------
    // GraphQL union extension — OFF by default since v1.0.3.
    // ---------------------------------------------------------------------
    //
    // What it would do, if it worked: expose every NDZ attribute as a
    // typed union member list, e.g.
    //   `blocks: [ComponentBlocksSection_blocks_NDZ!]`
    // instead of the default `blocks: JSON`. That lets consumers query
    //   ... on ComponentBlocksText { body }
    // and get proper introspection.
    //
    // Why it's off by default: Strapi's @strapi/plugin-graphql auto-
    // generates a `JSON`-typed field for every custom-field attribute
    // whose base type is `json` (which is our case). When our extension
    // tries to add a typed declaration for the same field, the two go
    // through `@graphql-tools/merge` which refuses two declarations of
    // the same field with different types and crashes Strapi at boot:
    //
    //   Error: Unable to merge GraphQL type "ComponentX": Field "y"
    //   already defined with a different type. Declared as "JSON", but
    //   you tried to override with "ComponentX_y_NDZ"
    //
    // There is no public Strapi v5 API to suppress an auto-generated
    // field for a *component* type (the `shadowCRUD().field().disable()`
    // API only works for content types).
    //
    // For now, NDZ fields are exposed as the `JSON` scalar in GraphQL —
    // the data still passes (clients can read/write the full array), just
    // without union typing. REST output is unaffected.
    //
    // If you want to experiment with the typed-union path, opt in via:
    //     NDZ_ENABLE_GRAPHQL_UNIONS=true
    // Expect crashes if the merge conflict triggers. We wrap the call in
    // try/catch so the error is logged but does not take down Strapi.
    // ---------------------------------------------------------------------
    if (process.env.NDZ_ENABLE_GRAPHQL_UNIONS === 'true') {
        try {
            (0, graphql_1.default)({ strapi }).apply();
        }
        catch (err) {
            strapi.log.error(`[nested-dynamic-zone] GraphQL union extension failed: ${err instanceof Error ? err.message : String(err)}. NDZ fields will be exposed as JSON in GraphQL.`);
        }
    }
};
//# sourceMappingURL=bootstrap.js.map