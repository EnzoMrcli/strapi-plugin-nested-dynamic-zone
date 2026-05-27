import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
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
import { Field, TextInput, NumberInput, Textarea, Toggle, SingleSelect, SingleSelectOption, Box, Flex, Typography, Loader, } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { loadComponentSchema } from '../../utils/schema-loader';
import pluginId from '../../pluginId';
const FIELD_ID = `plugin::${pluginId}.${pluginId}`;
// Lazy import the NDZ Input to break the import cycle between
// ItemEditor → NDZ Input → ItemEditor.
const LazyNdzInput = React.lazy(() => import('../Input'));
const ItemEditor = ({ uid, value, onChange, disabled }) => {
    const client = useFetchClient();
    const [schema, setSchema] = React.useState(null);
    const [error, setError] = React.useState(null);
    React.useEffect(() => {
        let alive = true;
        loadComponentSchema(uid, client).then((s) => { if (alive)
            setSchema(s); }, (e) => { if (alive)
            setError(e instanceof Error ? e.message : String(e)); });
        return () => { alive = false; };
    }, [uid, client]);
    if (error) {
        return (_jsx(Box, { padding: 2, children: _jsxs(Typography, { textColor: "danger600", children: ["Failed to load schema for ", uid, ": ", error] }) }));
    }
    if (!schema) {
        return (_jsx(Flex, { justifyContent: "center", padding: 3, children: _jsx(Loader, { small: true, children: "Loading\u2026" }) }));
    }
    const set = (key) => (next) => onChange({ [key]: next });
    return (_jsx(Flex, { direction: "column", gap: 3, alignItems: "stretch", children: Object.entries(schema.attributes).map(([key, attr]) => renderAttr(key, attr, value[key], set(key), Boolean(disabled))) }));
};
/** Small wrapper that adds the Field.Root + Field.Label scaffolding. */
const Labeled = ({ name, required, children, }) => (_jsxs(Field.Root, { name: name, required: Boolean(required), children: [_jsx(Field.Label, { children: name }), children] }));
function renderAttr(key, attr, value, setValue, disabled) {
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
            if (attr.customField === FIELD_ID) {
                return (_jsx(React.Suspense, { fallback: _jsx(Flex, { justifyContent: "center", padding: 2, children: _jsx(Loader, { small: true, children: "Loading\u2026" }) }), children: _jsx(LazyNdzInput, { name: key, attribute: attr, value: value, onChange: (e) => setValue(e.target.value), disabled: disabled, intlLabel: { defaultMessage: key } }) }, key));
            }
            return (_jsx(Labeled, { name: `${key} (raw)`, children: _jsx(Textarea, { value: value === undefined ? '' : JSON.stringify(value, null, 2), disabled: disabled, onChange: (e) => {
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
            return (_jsx(Labeled, { name: `${key} (id / ids JSON — use UI to look up)`, children: _jsx(Textarea, { value: value === undefined ? '' : JSON.stringify(value, null, 2), disabled: disabled, onChange: (e) => {
                        try {
                            setValue(JSON.parse(e.target.value));
                        }
                        catch {
                            setValue(e.target.value);
                        }
                    } }) }, key));
        default:
            return (_jsx(Box, { padding: 2, children: _jsxs(Typography, { variant: "pi", textColor: "neutral600", children: ["(unsupported field type: ", attr.type, ")"] }) }, key));
    }
}
export default ItemEditor;
//# sourceMappingURL=index.js.map