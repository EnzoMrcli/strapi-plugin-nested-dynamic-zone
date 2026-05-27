/**
 * Direct-instantiation wrapper around the GraphQL service factory.
 *
 * Bootstrap calls `graphqlFactory({ strapi }).apply()` directly now and
 * doesn't go through this file. It remains for external consumers that
 * want a one-line "apply NDZ to GraphQL" hook.
 */
import type { Core } from '@strapi/strapi';
import graphqlFactory from '../services/graphql';

export default ({ strapi }: { strapi: Core.Strapi }) => {
  graphqlFactory({ strapi }).apply();
};
