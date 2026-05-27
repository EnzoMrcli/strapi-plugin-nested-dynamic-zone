'use strict';

// CommonJS shim that Strapi's plugin loader picks up at the plugin root.
// The actual server code lives in dist/server/, compiled from server/*.ts.
//
// If you're working on the plugin from source: run `npm run build` to
// regenerate dist/. The repo ships a pre-built dist/ so a fresh clone works
// without any build step.

const mod = require('./dist/server');
module.exports = mod && mod.default ? mod.default : mod;
