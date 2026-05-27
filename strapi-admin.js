// ESM entry consumed by Strapi's admin bundler (Vite/Rollup).
//
// We use ESM syntax (`import` / `export default`). Rollup parses files
// syntactically; seeing `import` triggers ESM mode regardless of the
// package.json `type` field. This file is never required by Node directly —
// Strapi's server uses `strapi-server.js` (which IS CommonJS), so the
// apparent type mismatch is harmless.
//
// We import from `./dist/admin/index.js` (a real .js file produced by
// `tsc -p admin/tsconfig.json` with `module: "ESNext"`), not from the .ts
// source. That way Rollup's resolver doesn't have to do `.js` → `.ts`
// extension rewriting, which some Strapi versions disable.

import admin from './dist/admin/index.js';
export default admin;
