/**
 * Modal that lets the editor pick which component type to add.
 */
import * as React from 'react';
interface ComponentPickerProps {
    allowed: string[];
    onSelect: (uid: string) => void;
    onClose: () => void;
}
declare const ComponentPicker: React.FC<ComponentPickerProps>;
export default ComponentPicker;
//# sourceMappingURL=index.d.ts.map