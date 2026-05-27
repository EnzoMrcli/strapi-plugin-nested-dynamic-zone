interface AdminApp {
    customFields: {
        register: (config: unknown) => void;
    };
}
interface RegisterPayload {
    data: Record<string, string>;
    locale: string;
}
declare const admin: {
    register(app: AdminApp): void;
    registerTrads({ locales }: {
        locales: string[];
    }): Promise<RegisterPayload[]>;
    fieldUid: string;
};
export default admin;
//# sourceMappingURL=index.d.ts.map