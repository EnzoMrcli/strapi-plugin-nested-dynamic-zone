/**
 * Admin entry — registers the custom field with the Strapi admin app.
 */
import pluginId from './pluginId';

interface AdminApp {
  customFields: {
    register: (config: unknown) => void;
  };
}

interface RegisterPayload {
  data: Record<string, string>;
  locale: string;
}

const fieldUid = `plugin::${pluginId}.${pluginId}`;

const admin = {
  register(app: AdminApp): void {
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
        base: [
          {
            sectionTitle: {
              id: `${pluginId}.section.base`,
              defaultMessage: 'Components',
            },
            items: [
              {
                name: 'options.allowedComponents',
                type: 'json',
                intlLabel: {
                  id: `${pluginId}.option.allowedComponents`,
                  defaultMessage: 'Allowed components',
                },
                description: {
                  id: `${pluginId}.option.allowedComponents.desc`,
                  defaultMessage:
                    'JSON array of component UIDs, e.g. ["blocks.text", "blocks.image"]',
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
        validator: () => ({}),
      },
    });
  },

  async registerTrads({ locales }: { locales: string[] }): Promise<RegisterPayload[]> {
    return Promise.all(
      locales.map(async (locale): Promise<RegisterPayload> => {
        try {
          const data = await import(`./translations/${locale}.json`);
          const prefixed: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.default ?? data)) {
            prefixed[`${pluginId}.${k}`] = String(v);
          }
          return { data: prefixed, locale };
        } catch {
          return { data: {}, locale };
        }
      }),
    );
  },

  fieldUid,
};

export default admin;
