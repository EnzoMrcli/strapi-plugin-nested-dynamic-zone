/**
 * Main NDZ editor — renders a DZ-like list of typed blocks.
 */
import * as React from 'react';
export interface NdzAttribute {
    type: 'customField';
    customField: string;
    options?: {
        allowedComponents?: string[];
        min?: number;
        max?: number;
    };
}
export interface NdzItem {
    __component: string;
    __tempId?: string;
    [key: string]: unknown;
}
interface ChangeEvent {
    target: {
        name: string;
        value: NdzItem[];
        type: 'json';
    };
}
export interface InputProps {
    name: string;
    attribute: NdzAttribute;
    value?: NdzItem[] | string | null;
    onChange: (event: ChangeEvent) => void;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    intlLabel?: {
        id?: string;
        defaultMessage: string;
    };
    description?: {
        id?: string;
        defaultMessage?: string;
    };
    labelAction?: React.ReactNode;
    hint?: string;
}
declare const Input: React.FC<InputProps>;
export default Input;
//# sourceMappingURL=index.d.ts.map