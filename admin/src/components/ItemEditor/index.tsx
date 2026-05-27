/**
 * Recursive sub-form renderer.
 *
 * Field rendering pattern follows @strapi/design-system v2:
 *
 *   <Field.Root>
 *     <Field.Label>{label}</Field.Label>
 *     <TextInput value={...} onChange={...} />
 *   </Field.Root>
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
import { useFetchClient } from '@strapi/strapi/admin';
import { ComponentAttribute, ComponentSchema, loadComponentSchema } from '../../utils/schema-loader';
import pluginId from '../../pluginId';

const FIELD_ID = `plugin::${pluginId}.${pluginId}`;

interface ItemEditorProps {
  uid: string;
  value: Record<string, unknown>;
  onChange: (partial: Record<string, unknown>) => void;
  disabled?: boolean;
}

// Lazy import the NDZ Input to break the import cycle between
// ItemEditor → NDZ Input → ItemEditor.
const LazyNdzInput = React.lazy(() => import('../Input'));

const ItemEditor: React.FC<ItemEditorProps> = ({ uid, value, onChange, disabled }) => {
  const client = useFetchClient();
  const [schema, setSchema] = React.useState<ComponentSchema | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadComponentSchema(uid, client).then(
      (s) => { if (alive) setSchema(s); },
      (e: unknown) => { if (alive) setError(e instanceof Error ? e.message : String(e)); },
    );
    return (): void => { alive = false; };
  }, [uid, client]);

  if (error) {
    return (
      <Box padding={2}>
        <Typography textColor="danger600">Failed to load schema for {uid}: {error}</Typography>
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

  const set = (key: string) => (next: unknown): void => onChange({ [key]: next });

  return (
    <Flex direction="column" gap={3} alignItems="stretch">
      {Object.entries(schema.attributes).map(([key, attr]) =>
        renderAttr(key, attr, value[key], set(key), Boolean(disabled)),
      )}
    </Flex>
  );
};

/** Small wrapper that adds the Field.Root + Field.Label scaffolding. */
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
      if (attr.customField === FIELD_ID) {
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
      return (
        <Labeled key={key} name={`${key} (raw)`}>
          <Textarea
            value={value === undefined ? '' : JSON.stringify(value, null, 2)}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => {
              try { setValue(JSON.parse(e.target.value)); } catch { setValue(e.target.value); }
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
        <Labeled key={key} name={`${key} (id / ids JSON — use UI to look up)`}>
          <Textarea
            value={value === undefined ? '' : JSON.stringify(value, null, 2)}
            disabled={disabled}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => {
              try { setValue(JSON.parse(e.target.value)); } catch { setValue(e.target.value); }
            }}
          />
        </Labeled>
      );

    default:
      return (
        <Box key={key} padding={2}>
          <Typography variant="pi" textColor="neutral600">
            (unsupported field type: {attr.type})
          </Typography>
        </Box>
      );
  }
}

export default ItemEditor;
