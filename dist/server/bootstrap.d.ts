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
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => Promise<void>;
export default _default;
//# sourceMappingURL=bootstrap.d.ts.map