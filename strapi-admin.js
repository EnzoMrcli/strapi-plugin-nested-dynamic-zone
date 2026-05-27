'use strict';

// CommonJS shim that Strapi's admin bundler picks up at the plugin root.
// The actual admin code lives in dist/admin/, compiled from admin/src/*.{ts,tsx}.

const mod = require('./dist/admin');
module.exports = mod && mod.default ? mod.default : mod;
