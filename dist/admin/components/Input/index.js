import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Main NDZ editor — renders a DZ-like list of typed blocks.
 */
import * as React from 'react';
import { useIntl } from 'react-intl';
import { Box, Button, Flex, IconButton, Typography, } from '@strapi/design-system';
import { Plus, Trash, ArrowUp, ArrowDown } from '@strapi/icons';
import ComponentPicker from '../ComponentPicker';
import ItemEditor from '../ItemEditor';
import pluginId from '../../pluginId';
const newTempId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;
function parseValue(raw) {
    if (Array.isArray(raw))
        return raw;
    if (typeof raw === 'string' && raw.trim() !== '') {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    return [];
}
const Input = ({ name, attribute, value, onChange, intlLabel, disabled, error, }) => {
    const { formatMessage } = useIntl();
    const allowed = attribute.options?.allowedComponents ?? [];
    const max = attribute.options?.max ?? Infinity;
    const min = attribute.options?.min ?? 0;
    const items = React.useMemo(() => parseValue(value), [value]);
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const atMax = items.length >= max;
    const commit = React.useCallback((next) => {
        onChange({ target: { name, value: next, type: 'json' } });
    }, [name, onChange]);
    const add = React.useCallback((uid) => {
        commit([...items, { __component: uid, __tempId: newTempId() }]);
        setPickerOpen(false);
    }, [items, commit]);
    const remove = React.useCallback((index) => {
        commit(items.filter((_, i) => i !== index));
    }, [items, commit]);
    const move = React.useCallback((index, direction) => {
        const j = index + direction;
        if (j < 0 || j >= items.length)
            return;
        const next = items.slice();
        [next[index], next[j]] = [next[j], next[index]];
        commit(next);
    }, [items, commit]);
    const patch = React.useCallback((index, partial) => {
        const next = items.slice();
        next[index] = { ...next[index], ...partial };
        commit(next);
    }, [items, commit]);
    return (_jsxs(Box, { children: [intlLabel?.defaultMessage && (_jsx(Box, { paddingBottom: 2, children: _jsxs(Typography, { variant: "pi", fontWeight: "bold", children: [intlLabel.defaultMessage, min > 0 ? ' *' : ''] }) })), items.length === 0 && (_jsx(Box, { padding: 4, background: "neutral100", hasRadius: true, borderColor: "neutral200", borderStyle: "dashed", borderWidth: "1px", children: _jsx(Typography, { textColor: "neutral600", children: formatMessage({ id: `${pluginId}.editor.empty`, defaultMessage: 'No components yet.' }) }) })), _jsx(Box, { paddingTop: items.length > 0 ? 2 : 0, children: items.map((item, index) => (_jsxs(Box, { padding: 3, background: "neutral0", hasRadius: true, shadow: "filterShadow", marginBottom: 3, borderColor: "neutral200", borderStyle: "solid", borderWidth: "1px", children: [_jsxs(Flex, { justifyContent: "space-between", paddingBottom: 3, children: [_jsx(Typography, { variant: "sigma", textColor: "neutral600", children: item.__component }), _jsxs(Flex, { gap: 1, children: [_jsx(IconButton, { onClick: () => move(index, -1), disabled: Boolean(disabled) || index === 0, label: formatMessage({ id: `${pluginId}.editor.moveUp`, defaultMessage: 'Move up' }), children: _jsx(ArrowUp, {}) }), _jsx(IconButton, { onClick: () => move(index, 1), disabled: Boolean(disabled) || index === items.length - 1, label: formatMessage({ id: `${pluginId}.editor.moveDown`, defaultMessage: 'Move down' }), children: _jsx(ArrowDown, {}) }), _jsx(IconButton, { onClick: () => remove(index), disabled: Boolean(disabled), label: formatMessage({ id: `${pluginId}.editor.remove`, defaultMessage: 'Remove' }), children: _jsx(Trash, {}) })] })] }), _jsx(ItemEditor, { uid: item.__component, value: item, onChange: (partial) => patch(index, partial), disabled: Boolean(disabled) })] }, item.__tempId ?? `${item.__component}-${index}`))) }), atMax ? (_jsx(Box, { paddingTop: 2, children: _jsx(Typography, { variant: "pi", textColor: "neutral600", children: formatMessage({ id: `${pluginId}.editor.atMax`, defaultMessage: 'Maximum number of items reached' }) }) })) : (_jsx(Flex, { justifyContent: "center", paddingTop: 3, children: _jsx(Button, { variant: "secondary", startIcon: _jsx(Plus, {}), onClick: () => setPickerOpen(true), disabled: Boolean(disabled), children: formatMessage({ id: `${pluginId}.editor.add`, defaultMessage: 'Add a component' }) }) })), error && (_jsx(Box, { paddingTop: 2, children: _jsx(Typography, { variant: "pi", textColor: "danger600", children: error }) })), pickerOpen && (_jsx(ComponentPicker, { allowed: allowed, onSelect: add, onClose: () => setPickerOpen(false) }))] }));
};
export default Input;
//# sourceMappingURL=index.js.map