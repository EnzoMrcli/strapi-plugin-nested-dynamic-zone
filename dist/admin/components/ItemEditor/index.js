import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
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
import { Field, TextInput, NumberInput, Textarea, Toggle, SingleSelect, SingleSelectOption, Box, Flex, Typography, Loader, } from '@strapi/design-system';
import { useFetchClient, useStrapiApp } from '@strapi/strapi/admin';
import { loadComponentSchema } from '../../utils/schema-loader';
import pluginId from '../../pluginId';
const FIELD_ID = `plugin::${pluginId}.${pluginId}`;
// Lazy import the NDZ Input to break the import cycle.
const LazyNdzInput = React.lazy(() => import('../Input'));
/**
 * Lazy-load wrapper cache for custom field Inputs. We keep one
 * `React.lazy(...)` per customField UID across the lifetime of the
 * admin app — re-creating the lazy on each render would trigger fresh
 * dynamic imports and cause flickering.
 */
const customFieldInputCache = new Map();
function resolveCustomFieldInput(fieldUid, registry) {
    if (!registry || typeof registry.get !== 'function')
        return null;
    const cached = customFieldInputCache.get(fieldUid);
    if (cached)
        return cached;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = registry.get(fieldUid);
    const loader = config?.components?.Input;
    if (!loader)
        return null;
    const lazy = React.lazy(async () => {
        if (typeof loader === 'function') {
            const result = await loader();
            const mod = result;
            const Component = mod?.default ?? result;
            return { default: Component };
        }
        return { default: loader };
    });
    customFieldInputCache.set(fieldUid, lazy);
    return lazy;
}
const ItemEditor = ({ uid, value, onChange, disabled }) => {
    const client = useFetchClient();
    const customFieldsRegistry = useStrapiApp('NestedDynamicZoneItemEditor', 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state) => state.customFields);
    const [schema, setSchema] = React.useState(null);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        let alive = true;
        loadComponentSchema(uid, client).then((s) => {
            if (!alive)
                return;
            setSchema(s);
            // One-line diagnostic so users (and us) can verify what shape
            // came back. Open DevTools → Console and look for this line.
            if (typeof console !== 'undefined' && console.info) {
                console.info(`[nested-dynamic-zone] schema loaded for ${uid}:`, Object.entries(s.attributes ?? {}).map(([k, a]) => `${k}: ${a?.type ?? '???'}`));
            }
        }, (e) => {
            if (alive)
                setError(e instanceof Error ? e.message : String(e));
        });
        return () => {
            alive = false;
        };
    }, [uid, client]);
    if (error) {
        return (_jsx(Box, { padding: 2, children: _jsxs(Typography, { textColor: "danger600", children: ["Failed to load schema for ", uid, ": ", error] }) }));
    }
    if (!schema) {
        return (_jsx(Flex, { justifyContent: "center", padding: 3, children: _jsx(Loader, { small: true, children: "Loading\u2026" }) }));
    }
    if (!schema.attributes || typeof schema.attributes !== 'object') {
        return (_jsx(Box, { padding: 2, background: "warning100", hasRadius: true, children: _jsxs(Typography, { variant: "pi", textColor: "warning700", children: ["Schema for ", uid, " loaded without an `attributes` field. Check that the admin user has access to /content-type-builder/components/* and that the component still exists in src/components/."] }) }));
    }
    const set = (key) => (next) => onChange({ [key]: next });
    return (_jsx(Flex, { direction: "column", gap: 3, alignItems: "stretch", children: Object.entries(schema.attributes).map(([key, attr]) => renderAttr(key, attr, value[key], set(key), Boolean(disabled), customFieldsRegistry)) }));
};
const Labeled = ({ name, required, children, }) => (_jsxs(Field.Root, { name: name, required: Boolean(required), children: [_jsx(Field.Label, { children: name }), children] }));
function renderAttr(key, attr, value, setValue, disabled, customFieldsRegistry) {
    switch (attr.type) {
        case 'string':
        case 'uid':
        case 'email':
        case 'password':
            return (_jsx(Labeled, { name: key, required: attr.required, children: _jsx(TextInput, { value: value ?? '', disabled: disabled, onChange: (e) => setValue(e.target.value) }) }, key));
        case 'text':
        case 'richtext':
        case 'blocks':
        case 'json':
            return (_jsx(Labeled, { name: key, required: attr.required, children: _jsx(Textarea, { value: typeof value === 'string'
                        ? value
                        : value === undefined
                            ? ''
                            : JSON.stringify(value, null, 2), disabled: disabled, onChange: (e) => setValue(e.target.value) }) }, key));
        case 'integer':
        case 'biginteger':
        case 'float':
        case 'decimal':
            return (_jsx(Labeled, { name: key, required: attr.required, children: _jsx(NumberInput, { value: value ?? undefined, disabled: disabled, onValueChange: (next) => setValue(next) }) }, key));
        case 'boolean':
            return (_jsx(Labeled, { name: key, required: attr.required, children: _jsx(Toggle, { checked: Boolean(value), disabled: disabled, onLabel: "True", offLabel: "False", onChange: (e) => setValue(e.target.checked) }) }, key));
        case 'enumeration':
            return (_jsx(Labeled, { name: key, required: attr.required, children: _jsx(SingleSelect, { value: value ?? '', disabled: disabled, onChange: (next) => setValue(String(next)), children: (attr.enum ?? []).map((opt) => (_jsx(SingleSelectOption, { value: opt, children: opt }, opt))) }) }, key));
        case 'date':
        case 'datetime':
        case 'time':
        case 'timestamp':
            return (_jsx(Labeled, { name: `${key} (${attr.type})`, required: attr.required, children: _jsx(TextInput, { value: value ?? '', disabled: disabled, onChange: (e) => setValue(e.target.value) }) }, key));
        case 'component': {
            if (typeof attr.component !== 'string')
                return null;
            const childValue = value ?? {};
            return (_jsxs(Box, { padding: 2, background: "neutral100", hasRadius: true, children: [_jsx(Typography, { variant: "sigma", children: key }), _jsx(Box, { paddingTop: 2, children: _jsx(ItemEditor, { uid: attr.component, value: childValue, onChange: (partial) => setValue({ ...childValue, ...partial }), disabled: disabled }) })] }, key));
        }
        case 'customField': {
            const cfUid = typeof attr.customField === 'string' ? attr.customField : '';
            // Recursive NDZ-in-NDZ.
            if (cfUid === FIELD_ID) {
                return (_jsx(React.Suspense, { fallback: _jsx(Flex, { justifyContent: "center", padding: 2, children: _jsx(Loader, { small: true, children: "Loading\u2026" }) }), children: _jsx(LazyNdzInput, { name: key, attribute: attr, value: value, onChange: (e) => setValue(e.target.value), disabled: disabled, intlLabel: { defaultMessage: key } }) }, key));
            }
            // Any other registered custom field — delegate to its Input.
            const RegisteredInput = resolveCustomFieldInput(cfUid, customFieldsRegistry);
            if (RegisteredInput) {
                const ForwardedInput = RegisteredInput;
                return (_jsx(React.Suspense, { fallback: _jsx(Flex, { justifyContent: "center", padding: 2, children: _jsx(Loader, { small: true, children: "Loading\u2026" }) }), children: _jsx(ForwardedInput, { name: key, attribute: attr, value: value, onChange: (event) => {
                            // Custom field convention: event-shaped change handler
                            // with target.value. Tolerate the older shape that
                            // passes the raw value too.
                            const next = event && typeof event === 'object' && 'target' in event
                                ? event.target.value
                                : event;
                            setValue(next);
                        }, disabled: disabled, required: attr.required, intlLabel: { id: key, defaultMessage: key } }) }, key));
            }
            // Custom field not registered (plugin missing or not yet loaded) —
            // fall back to a JSON textarea so the editor isn't blocked.
            return (_jsx(Labeled, { name: `${key} (${cfUid || 'custom field'} — raw)`, children: _jsx(Textarea, { value: value === undefined ? '' : JSON.stringify(value, null, 2), disabled: disabled, onChange: (e) => {
                        try {
                            setValue(JSON.parse(e.target.value));
                        }
                        catch {
                            setValue(e.target.value);
                        }
                    } }) }, key));
        }
        case 'dynamiczone':
            return (_jsx(Box, { padding: 2, background: "warning100", hasRadius: true, children: _jsxs(Typography, { variant: "pi", children: ["\"", key, "\" is a native dynamic zone \u2014 use Nested Dynamic Zone instead."] }) }, key));
        case 'media':
        case 'relation':
            return (_jsx(Labeled, { name: `${key} (${attr.type} — paste id / ids JSON for now)`, children: _jsx(Textarea, { value: value === undefined ? '' : JSON.stringify(value, null, 2), disabled: disabled, onChange: (e) => {
                        try {
                            setValue(JSON.parse(e.target.value));
                        }
                        catch {
                            setValue(e.target.value);
                        }
                    } }) }, key));
        default:
            return (_jsx(Box, { padding: 2, children: _jsxs(Typography, { variant: "pi", textColor: "neutral600", children: ["(", key, ": unsupported field type \"", String(attr.type), "\")"] }) }, key));
    }
}
export default ItemEditor;
//# sourceMappingURL=index.js.map