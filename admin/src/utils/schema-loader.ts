/**
 * Component-schema loader for the admin UI.
 * Caches promises so concurrent calls for the same UID coalesce.
 */

export interface ComponentSchema {
  uid: string;
  attributes: Record<string, ComponentAttribute>;
  info?: { displayName?: string; description?: string; icon?: string };
}

export interface ComponentAttribute {
  type: string;
  component?: string;
  components?: string[];
  customField?: string;
  options?: Record<string, unknown>;
  required?: boolean;
  default?: unknown;
  enum?: string[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  multiple?: boolean;
  [key: string]: unknown;
}

type FetchClient = {
  get: (url: string) => Promise<{ data: unknown }>;
};

const cache = new Map<string, Promise<ComponentSchema>>();

function unwrap(body: unknown): ComponentSchema {
  const b = body as { data?: unknown };
  const data = b?.data ?? body;
  const d = data as Record<string, unknown>;
  if (d?.component && typeof d.component === 'object') return d.component as unknown as ComponentSchema;
  if (d?.contentType && typeof d.contentType === 'object') return d.contentType as unknown as ComponentSchema;
  if (d?.attributes) return d as unknown as ComponentSchema;
  throw new Error('Unrecognized component schema response shape');
}

export function loadComponentSchema(
  uid: string,
  client: FetchClient,
): Promise<ComponentSchema> {
  let cached = cache.get(uid);
  if (cached) return cached;
  cached = client
    .get(`/content-manager/components/${uid}/configuration`)
    .then((res) => unwrap(res.data))
    .catch(async (err) => {
      try {
        const res = await client.get(`/content-type-builder/components/${uid}`);
        return unwrap(res.data);
      } catch {
        throw err;
      }
    });
  cache.set(uid, cached);
  cached.catch(() => cache.delete(uid));
  return cached;
}

export function _resetSchemaCache(): void {
  cache.clear();
}
