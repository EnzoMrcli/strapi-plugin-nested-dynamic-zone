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
interface ItemEditorProps {
    uid: string;
    value: Record<string, unknown>;
    onChange: (partial: Record<string, unknown>) => void;
    disabled?: boolean;
}
declare const ItemEditor: React.FC<ItemEditorProps>;
export default ItemEditor;
//# sourceMappingURL=index.d.ts.map