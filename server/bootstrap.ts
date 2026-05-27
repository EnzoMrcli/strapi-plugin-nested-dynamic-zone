/**
 * Bootstrap phase — runs once all plugins have registered.
 *
 * We instantiate the plugin's services directly from their factories and
 * pass them as explicit dependencies to the middleware + GraphQL
 * extension. We deliberately do NOT go through
 *     strapi.plugin('nested-dynamic-zone').service(...)
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
  const graphqlSvc = graphqlFactory({ strapi });

  documentServiceMiddleware({ strapi, validator, serializer });
  graphqlSvc.apply();
};
