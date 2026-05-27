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
interface ItemEditorProps {
    uid: string;
    value: Record<string, unknown>;
    onChange: (partial: Record<string, unknown>) => void;
    disabled?: boolean;
}
declare const ItemEditor: React.FC<ItemEditorProps>;
export default ItemEditor;
//# sourceMappingURL=index.d.ts.map