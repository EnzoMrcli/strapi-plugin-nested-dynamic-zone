/**
 * Admin entry — registers the custom field with the Strapi admin app.
 */
import pluginId from './pluginId';
const fieldUid = `plugin::${pluginId}.${pluginId}`;
const admin = {
    register(app) {
        app.customFields.register({
            name: pluginId,
            pluginId,
            type: 'json',
            intlLabel: {
                id: `${pluginId}.label`,
                defaultMessage: 'Nested Dynamic Zone',
            },
            intlDescription: {
                id: `${pluginId}.description`,
                defaultMessage: 'A dynamic zone you can use inside a component.',
            },
            icon: undefined,
            components: {
                Input: async () => import('./components/Input'),
            },
            options: {
                // Strapi v5's Content-Type Builder only reliably supports a small
                // set of option input types: string, number, boolean, select,
                // checkbox, select-default-boolean. Using `type: 'json'` for the
                // `allowedComponents` option caused the server-side schema
                // validator to reject the save with a 400 in some Strapi 5.x
                // patch releases (see github issue trail in the README).
                //
                // So we use `type: 'string'` and accept comma-separated UIDs in
                // the form. `parseAllowedComponents` (in both server and admin)
                // tolerates both the CSV form AND a JSON array string AND a real
                // array, so schemas hand-edited as JSON keep working.
                base: [
                    {
                        sectionTitle: {
                            id: `${pluginId}.section.base`,
                            defaultMessage: 'Components',
                        },
                        items: [
                            {
                                name: 'options.allowedComponents',
                                type: 'string',
                                intlLabel: {
                                    id: `${pluginId}.option.allowedComponents`,
                                    defaultMessage: 'Allowed components',
                                },
                                description: {
                                    id: `${pluginId}.option.allowedComponents.desc`,
                                    defaultMessage: 'Comma-separated list of component UIDs, e.g. blocks.text,blocks.image',
                                },
                            },
                            {
                                name: 'options.min',
                                type: 'number',
                                intlLabel: {
                                    id: `${pluginId}.option.min`,
                                    defaultMessage: 'Min items',
                                },
                            },
                            {
                                name: 'options.max',
                                type: 'number',
                                intlLabel: {
                                    id: `${pluginId}.option.max`,
                                    defaultMessage: 'Max items',
                                },
                            },
                        ],
                    },
                ],
                advanced: [],
                // NOTE: we deliberately do NOT pass a `validator: () => ({})`
                // function here. Strapi 5's admin dispatches this options object
                // through Redux; a function value triggers the
                //   "non-serializable value was detected in an action" warning
                // (see https://redux.js.org/faq/actions). The `validator` field
                // is optional per the Strapi docs.
            },
        });
    },
    async registerTrads({ locales }) {
        return Promise.all(locales.map(async (locale) => {
            try {
                const data = await import(`./translations/${locale}.json`);
                const prefixed = {};
                for (const [k, v] of Object.entries(data.default ?? data)) {
                    prefixed[`${pluginId}.${k}`] = String(v);
                }
                return { data: prefixed, locale };
            }
            catch {
                return { data: {}, locale };
            }
        }));
    },
    fieldUid,
};
export default admin;
//# sourceMappingURL=index.js.map