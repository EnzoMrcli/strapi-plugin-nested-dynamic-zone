/**
 * Bootstrap phase — runs once all plugins have registered.
 *
 * We instantiate the plugin's services directly from their factories and
 * pass them as explicit dependencies to the middleware. We deliberately
 * do NOT go through `strapi.plugin('nested-dynamic-zone').service(...)`
 * because that lookup depends on the user's `config/plugins.ts` key
 * matching the literal string `'nested-dynamic-zone'`. People who unpack
 * GitHub zips end up with folders like
 * `strapi-plugin-nested-dynamic-zone-main/` and innocently use that
 * folder name as the config key, which makes the lookup return undefined
 * and crashes bootstrap with
 *     TypeError: Cannot read properties of undefined (reading 'service').
 *
 * Direct factory instantiation sidesteps that entirely.
 */
import type { Core } from '@strapi/strapi';
import documentServiceMiddleware from './middlewares/document-service';
import validatorFactory from './services/validator';
import sanitizerFactory from './services/sanitizer';
import serializerFactory from './services/serializer';
import graphqlFactory from './services/graphql';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  const sanitizer = sanitizerFactory({ strapi });
  const validator = validatorFactory({ strapi });
  const serializer = serializerFactory({ strapi, sanitizer });

  documentServiceMiddleware({ strapi, validator, serializer });

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
      graphqlFactory({ strapi }).apply();
    } catch (err) {
      strapi.log.error(
        `[nested-dynamic-zone] GraphQL union extension failed: ${
          err instanceof Error ? err.message : String(err)
        }. NDZ fields will be exposed as JSON in GraphQL.`,
      );
    }
  }
};
