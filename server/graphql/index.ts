/**
 * Sugar wrapper around the GraphQL service factory.
 */
import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const factory = strapi.plugin('nested-dynamic-zone').service('graphql') as {
    apply: () => void;
  };
  factory.apply();
};
