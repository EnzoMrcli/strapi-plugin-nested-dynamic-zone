/**
 * Bootstrap phase — runs once all plugins have registered.
 */
import type { Core } from '@strapi/strapi';
import documentServiceMiddleware from './middlewares/document-service';
import graphqlExtension from './graphql';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  documentServiceMiddleware({ strapi });
  graphqlExtension({ strapi });
};
