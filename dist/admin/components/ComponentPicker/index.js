import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Modal that lets the editor pick which component type to add.
 */
import * as React from 'react';
import { useIntl } from 'react-intl';
import { Modal, Box, Button, Typography, Flex } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { loadComponentSchema } from '../../utils/schema-loader';
import pluginId from '../../pluginId';
const ComponentPicker = ({ allowed, onSelect, onClose }) => {
    const { formatMessage } = useIntl();
    const client = useFetchClient();
    const [labels, setLabels] = React.useState({});
    React.useEffect(() => {
        let alive = true;
        void Promise.all(allowed.map(async (uid) => {
            try {
                const schema = await loadComponentSchema(uid, client);
                return [uid, schema.info ?? {}];
            }
            catch {
                return [uid, {}];
            }
        })).then((entries) => {
            if (!alive)
                return;
            const next = {};
            for (const [uid, info] of entries)
                next[uid] = info;
            setLabels(next);
        });
        return () => { alive = false; };
    }, [allowed, client]);
    return (_jsx(Modal.Root, { open: true, onOpenChange: (open) => { if (!open)
            onClose(); }, children: _jsxs(Modal.Content, { children: [_jsx(Modal.Header, { children: _jsx(Modal.Title, { children: formatMessage({ id: `${pluginId}.picker.title`, defaultMessage: 'Pick a component' }) }) }), _jsx(Modal.Body, { children: allowed.length === 0 ? (_jsx(Typography, { textColor: "neutral600", children: formatMessage({
                            id: `${pluginId}.picker.empty`,
                            defaultMessage: 'No components are allowed here. Configure the field\'s allowedComponents option.',
                        }) })) : (_jsx(Flex, { direction: "column", gap: 2, alignItems: "stretch", children: allowed.map((uid) => {
                            const label = labels[uid]?.displayName ?? uid;
                            return (_jsx(Button, { variant: "tertiary", fullWidth: true, onClick: () => onSelect(uid), children: _jsxs(Box, { style: { textAlign: 'left', width: '100%' }, children: [_jsx(Typography, { fontWeight: "bold", children: label }), _jsx(Typography, { variant: "pi", textColor: "neutral600", children: uid })] }) }, uid));
                        }) })) }), _jsx(Modal.Footer, { children: _jsx(Button, { variant: "tertiary", onClick: onClose, children: formatMessage({ id: `${pluginId}.picker.cancel`, defaultMessage: 'Cancel' }) }) })] }) }));
};
export default ComponentPicker;
//# sourceMappingURL=index.js.map