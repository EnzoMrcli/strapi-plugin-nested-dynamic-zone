/**
 * Server module surface — what Strapi loads when the plugin boots.
 */
import register from './register';
import bootstrap from './bootstrap';
import validator from './services/validator';
import sanitizer from './services/sanitizer';
import serializer from './services/serializer';
import graphql from './services/graphql';

export default {
  register,
  bootstrap,
  services: {
    validator,
    sanitizer,
    serializer,
    graphql,
  },
  contentTypes: {},
  policies: {},
  routes: [],
  controllers: {},
};

export type { NdzAttribute } from './types';
