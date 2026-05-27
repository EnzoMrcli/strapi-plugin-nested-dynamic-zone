declare const _default: {
    register: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => void;
    bootstrap: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => Promise<void>;
    services: {
        validator: ({ strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => import("./services/validator").ValidatorService;
        sanitizer: ({ strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => import("./services/sanitizer").SanitizerService;
        serializer: ({ strapi, sanitizer }: import("./services/serializer").SerializerArgs) => import("./services/serializer").SerializerService;
        graphql: ({ strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => {
            apply(): void;
        };
    };
    contentTypes: {};
    policies: {};
    routes: never[];
    controllers: {};
};
export default _default;
export type { NdzAttribute } from './types';
//# sourceMappingURL=index.d.ts.map