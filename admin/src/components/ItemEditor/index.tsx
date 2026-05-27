/**
 * Recursive sub-form renderer.
 *
 * Given a component UID + the current item value, fetches the component
 * schema and renders an input per attribute.
 *
 * Strategy for picking the input component:
 *
 *   - For built-in scalar types (string, text, integer, boolean, etc.)
 *     we render the matching @strapi/design-system input.
 *   - For nested `component` attributes we recurse into ItemEditor.
 *   - For OUR own custom field (FIELD_ID) we lazy-import the NDZ Input
 *     (breaking the cycle ItemEditor → Input → ItemEditor).
 *   - For ANY OTHER custom field (color-picker, datetime-picker, your
 *     own plugins...) we resolve the registered `Input` component from
 *     Strapi's `app.customFields` registry and render it directly.
 *     This is what makes "I want to nest other custom components"
 *     work end-to-end — we don't reimplement those inputs, we just
 *     delegate to the plugins that registered them.
 *   - As a last resort (media, relation, unknown types) we fall back
 *     to a JSON textarea. Media + relation pickers from Strapi aren't
 *     stable public exports, so users have to drop in IDs by hand
 *     for now; this is documented as a known limitation.
 */
import * as React from 'react';
import {
  Field,
  TextInput,
  NumberInput,
  Textarea,
  Toggle,
  SingleSelect,
  SingleSelectOption,
  Box,
  Flex,
  Typography,
  Loader,
} from '@strapi/design-system';
import { useFetchClient, useStrapiApp } from '@strapi/strapi/admin';
import { ComponentAttribute, ComponentSchema, loadComponentSchema } from '../../utils/schema-loader';
import pluginId from '../../pluginId';

const FIELD_ID = `plugin::${pluginId}.${pluginId}`;

interface ItemEditorProps {
  uid: string;
  value: Record<string, unknown>;
  onChange: (partial: Record<string, unknown>) => void;
  disabled?: boolean;
}

// Lazy import the NDZ Input to break the import cycle.
const LazyNdzInput = React.lazy(() => import('../Input'));

/**
 * Strapi's customFields registry — shape (paraphrased from v5 admin):
 *   {
 *     register(config): void
 *     get(uid: string): RegisteredCustomField | undefined
 *     getAll(): Record<string, RegisteredCustomField>
 *   }
 *
 * We type it loosely as `unknown`-shaped on purpose: Strapi's published
 * types narrow `components.Input` differently per version, and locking
 * to one of those shapes would force users on a different minor to
 * patch this file. Runtime checks (`typeof loader === 'function'`)
 * keep us honest where TypeScript can't.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomFieldsRegistry = any;

/**
 * Lazy-load wrapper cache for custom field Inputs. We keep one
 * `React.lazy(...)` per customField UID across the lifetime of the
 * admin app — re-creating the lazy on each render would trigger fresh
 * dynamic imports and cause flickering.
 */
const customFieldInputCache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<unknown>>
>();

function resolveCustomFieldInput(
  fieldUid: string,
  registry: CustomFieldsRegistry,
): React.LazyExoticComponent<React.ComponentType<unknown>> | null {
  if (!registry || typeof registry.get !== 'function') return null;
  const cached = customFieldInputCache.get(fieldUid);
  if (cached) return cached;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = registry.get(fieldUid) as any;
  const loader = config?.components?.Input;
  if (!loader) return null;
  const lazy = React.lazy(async () => {
    if (typeof loader === 'function') {
      const result = await (loader as () => Promise<unknown>)();
      const mod = result as { default?: React.ComponentType<unknown> };
      const Component = mod?.default ?? (result as React.ComponentType<unknown>);
      return { default: Component };
    }
    return { default: loader as React.ComponentType<unknown> };
  });
  customFieldInputCache.set(fieldUid, lazy);
  return lazy;
}

const ItemEditor: React.FC<ItemEditorProps> = ({ uid, value, onChange, disabled }) => {
  const client = useFetchClient();
  const customFieldsRegistry = useStrapiApp(
    'NestedDynamicZoneItemEditor',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.customFields,
  ) as CustomFieldsRegistry;

  const [schema, setSchema] = React.useState<ComponentSchema | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadComponentSchema(uid, client).then(
      (s) => {
        if (!alive) return;
        setSchema(s);
        // One-line diagnostic so users (and us) can verify what shape
        // came back. Open DevTools → Console and look for this line.
        if (typeof console !== 'undefined' && console.info) {
          console.info(
            `[nested-dynamic-zone] schema loaded for ${uid}:`,
            Object.entries(s.attributes ?? {}).map(([k, a]) => `${k}: ${a?.type ?? '???'}`),
          );
        }
      },
      (e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      },
    );
    return (): void => {
      alive = false;
    };
  }, [uid, client]);

  if (error) {
    return (
      <Box padding={2}>
        <Typography textColor="danger600">
          Failed to load schema for {uid}: {error}
        </Typography>
      </Box>
    );
  }
  if (!schema) {
    return (
      <Flex justifyContent="center" padding={3}>
        <Loader small>Loading…</Loader>
      </Flex>
    );
  }
  if (!schema.attributes || typeof schema.attributes !== 'object') {
    return (
      <Box padding={2} background="warning100" hasRadius>
        <Typography variant="pi" textColor="warning700">
          Schema for {uid} loaded without an `attributes` field. Check that the
          admin user has access to /content-type-builder/components/* and that
          the component still exists in src/components/.
        </Typography>
      </Box>
    );
  }

  const set = (key: string) => (next: unknown): void => onChange({ [key]: next });

  return (
    <Flex direction="column" gap={3} alignItems="stretch">
      {Object.entries(schema.attributes).map(([key, attr]) =>
        renderAttr(key, attr, value[key], set(key), Boolean(disabled), customFieldsRegistry),
      )}
    </Flex>
  );
};

const Labeled: React.FC<{ name: string; required?: boolean; children: React.ReactNode }> = ({
  name,
  required,
  children,
}) => (
  <Field.Root name={name} required={Boolean(required)}>
    <Field.Label>{name}</Field.Label>
    {children}
  </Field.Root>
);

function renderAttr(
  key: string,
  attr: ComponentAttribute,
  value: unknown,
  setValue: (v: unknown) => void,
  disabled: boolean,
  customFieldsRegistry: CustomFieldsRegistry,
): React.ReactNode {
  switch (attr.type) {
    case 'string':
    case 'uid':
    case 'email':
    case 'password':
      return (
        <Labeled key={key} name={key} required={attr.required}>
          <TextInput
            value={(value as string | undefined) ?? ''}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setValue(e.target.value)}
          />
        </Labeled>
      );

    case 'text':
    case 'richtext':
    case 'blocks':
    case 'json':
      return (
        <Labeled key={key} name={key} required={attr.required}>
          <Textarea
            value={
              typeof value === 'string'
                ? value
                : value === undefined
                  ? ''
                  : JSON.stringify(value, null, 2)
            }
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => setValue(e.target.value)}
          />
        </Labeled>
      );

    case 'integer':
    case 'biginteger':
    case 'float':
    case 'decimal':
      return (
        <Labeled key={key} name={key} required={attr.required}>
          <NumberInput
            value={(value as number | undefined) ?? undefined}
            disabled={disabled}
            onValueChange={(next: number | undefined): void => setValue(next)}
          />
        </Labeled>
      );

    case 'boolean':
      return (
        <Labeled key={key} name={key} required={attr.required}>
          <Toggle
            checked={Boolean(value)}
            disabled={disabled}
            onLabel="True"
            offLabel="False"
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setValue(e.target.checked)}
          />
        </Labeled>
      );

    case 'enumeration':
      return (
        <Labeled key={key} name={key} required={attr.required}>
          <SingleSelect
            value={(value as string | undefined) ?? ''}
            disabled={disabled}
            onChange={(next: string | number): void => setValue(String(next))}
          >
            {(attr.enum ?? []).map((opt) => (
              <SingleSelectOption key={opt} value={opt}>{opt}</SingleSelectOption>
            ))}
          </SingleSelect>
        </Labeled>
      );

    case 'date':
    case 'datetime':
    case 'time':
    case 'timestamp':
      return (
        <Labeled key={key} name={`${key} (${attr.type})`} required={attr.required}>
          <TextInput
            value={(value as string | undefined) ?? ''}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setValue(e.target.value)}
          />
        </Labeled>
      );

    case 'component': {
      if (typeof attr.component !== 'string') return null;
      const childValue = (value as Record<string, unknown> | undefined) ?? {};
      return (
        <Box key={key} padding={2} background="neutral100" hasRadius>
          <Typography variant="sigma">{key}</Typography>
          <Box paddingTop={2}>
            <ItemEditor
              uid={attr.component}
              value={childValue}
              onChange={(partial): void => setValue({ ...childValue, ...partial })}
              disabled={disabled}
            />
          </Box>
        </Box>
      );
    }

    case 'customField': {
      const cfUid = typeof attr.customField === 'string' ? attr.customField : '';

      // Recursive NDZ-in-NDZ.
      if (cfUid === FIELD_ID) {
        return (
          <React.Suspense
            fallback={
              <Flex justifyContent="center" padding={2}>
                <Loader small>Loading…</Loader>
              </Flex>
            }
            key={key}
          >
            <LazyNdzInput
              name={key}
              attribute={attr as unknown as React.ComponentProps<typeof LazyNdzInput>['attribute']}
              value={value as React.ComponentProps<typeof LazyNdzInput>['value']}
              onChange={(e): void => setValue(e.target.value)}
              disabled={disabled}
              intlLabel={{ defaultMessage: key }}
            />
          </React.Suspense>
        );
      }

      // Any other registered custom field — delegate to its Input.
      const RegisteredInput = resolveCustomFieldInput(cfUid, customFieldsRegistry);
      if (RegisteredInput) {
        const ForwardedInput = RegisteredInput as unknown as React.ComponentType<{
          name: string;
          attribute: unknown;
          value: unknown;
          onChange: (event: { target: { name: string; value: unknown; type: string } }) => void;
          disabled?: boolean;
          required?: boolean;
          intlLabel?: { id?: string; defaultMessage: string };
          description?: { id?: string; defaultMessage?: string };
        }>;
        return (
          <React.Suspense
            fallback={
              <Flex justifyContent="center" padding={2}>
                <Loader small>Loading…</Loader>
              </Flex>
            }
            key={key}
          >
            <ForwardedInput
              name={key}
              attribute={attr}
              value={value}
              onChange={(event): void => {
                // Custom field convention: event-shaped change handler
                // with target.value. Tolerate the older shape that
                // passes the raw value too.
                const next =
                  event && typeof event === 'object' && 'target' in event
                    ? (event as { target: { value: unknown } }).target.value
                    : event;
                setValue(next);
              }}
              disabled={disabled}
              required={attr.required}
              intlLabel={{ id: key, defaultMessage: key }}
            />
          </React.Suspense>
        );
      }

      // Custom field not registered (plugin missing or not yet loaded) —
      // fall back to a JSON textarea so the editor isn't blocked.
      return (
        <Labeled key={key} name={`${key} (${cfUid || 'custom field'} — raw)`}>
          <Textarea
            value={value === undefined ? '' : JSON.stringify(value, null, 2)}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => {
              try {
                setValue(JSON.parse(e.target.value));
              } catch {
                setValue(e.target.value);
              }
            }}
          />
        </Labeled>
      );
    }

    case 'dynamiczone':
      return (
        <Box key={key} padding={2} background="warning100" hasRadius>
          <Typography variant="pi">
            "{key}" is a native dynamic zone — use Nested Dynamic Zone instead.
          </Typography>
        </Box>
      );

    case 'media':
    case 'relation':
      return (
        <Labeled key={key} name={`${key} (${attr.type} — paste id / ids JSON for now)`}>
          <Textarea
            value={value === undefined ? '' : JSON.stringify(value, null, 2)}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => {
              try {
                setValue(JSON.parse(e.target.value));
              } catch {
                setValue(e.target.value);
              }
            }}
          />
        </Labeled>
      );

    default:
      return (
        <Box key={key} padding={2}>
          <Typography variant="pi" textColor="neutral600">
            ({key}: unsupported field type "{String(attr.type)}")
          </Typography>
        </Box>
      );
  }
}

export default ItemEditor;
