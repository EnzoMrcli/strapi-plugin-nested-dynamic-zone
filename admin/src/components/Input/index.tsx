/**
 * Main NDZ editor — renders a DZ-like list of typed blocks.
 */
import * as React from 'react';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Typography,
} from '@strapi/design-system';
import { Plus, Trash, ArrowUp, ArrowDown } from '@strapi/icons';
import ComponentPicker from '../ComponentPicker';
import ItemEditor from '../ItemEditor';
import pluginId from '../../pluginId';
import { parseAllowedComponents } from '../../utils/parse-allowed-components';

export interface NdzAttribute {
  type: 'customField';
  customField: string;
  options?: {
    // Accepts either a real array or a CSV/JSON string — see
    // utils/parse-allowed-components.ts for the parsing rules.
    allowedComponents?: string[] | string;
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
  target: { name: string; value: NdzItem[]; type: 'json' };
}

export interface InputProps {
  name: string;
  attribute: NdzAttribute;
  value?: NdzItem[] | string | null;
  onChange: (event: ChangeEvent) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  intlLabel?: { id?: string; defaultMessage: string };
  description?: { id?: string; defaultMessage?: string };
  labelAction?: React.ReactNode;
  hint?: string;
}

const newTempId = (): string => `tmp-${Math.random().toString(36).slice(2, 10)}`;

function parseValue(raw: InputProps['value']): NdzItem[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const Input: React.FC<InputProps> = ({
  name,
  attribute,
  value,
  onChange,
  intlLabel,
  disabled,
  error,
}) => {
  const { formatMessage } = useIntl();
  const allowed = parseAllowedComponents(attribute.options?.allowedComponents);
  const max = attribute.options?.max ?? Infinity;
  const min = attribute.options?.min ?? 0;

  const items = React.useMemo(() => parseValue(value), [value]);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const atMax = items.length >= max;

  const commit = React.useCallback(
    (next: NdzItem[]): void => {
      onChange({ target: { name, value: next, type: 'json' } });
    },
    [name, onChange],
  );

  const add = React.useCallback(
    (uid: string): void => {
      commit([...items, { __component: uid, __tempId: newTempId() }]);
      setPickerOpen(false);
    },
    [items, commit],
  );

  const remove = React.useCallback(
    (index: number): void => {
      commit(items.filter((_, i) => i !== index));
    },
    [items, commit],
  );

  const move = React.useCallback(
    (index: number, direction: -1 | 1): void => {
      const j = index + direction;
      if (j < 0 || j >= items.length) return;
      const next = items.slice();
      [next[index], next[j]] = [next[j], next[index]];
      commit(next);
    },
    [items, commit],
  );

  const patch = React.useCallback(
    (index: number, partial: Partial<NdzItem>): void => {
      const next = items.slice();
      next[index] = { ...next[index], ...partial };
      commit(next);
    },
    [items, commit],
  );

  return (
    <Box>
      {intlLabel?.defaultMessage && (
        <Box paddingBottom={2}>
          <Typography variant="pi" fontWeight="bold">
            {intlLabel.defaultMessage}
            {min > 0 ? ' *' : ''}
          </Typography>
        </Box>
      )}

      {items.length === 0 && (
        <Box
          padding={4}
          background="neutral100"
          hasRadius
          borderColor="neutral200"
          borderStyle="dashed"
          borderWidth="1px"
        >
          <Typography textColor="neutral600">
            {formatMessage({ id: `${pluginId}.editor.empty`, defaultMessage: 'No components yet.' })}
          </Typography>
        </Box>
      )}

      <Box paddingTop={items.length > 0 ? 2 : 0}>
        {items.map((item, index) => (
          <Box
            key={item.__tempId ?? `${item.__component}-${index}`}
            padding={3}
            background="neutral0"
            hasRadius
            shadow="filterShadow"
            marginBottom={3}
            borderColor="neutral200"
            borderStyle="solid"
            borderWidth="1px"
          >
            <Flex justifyContent="space-between" paddingBottom={3}>
              <Typography variant="sigma" textColor="neutral600">
                {item.__component}
              </Typography>
              <Flex gap={1}>
                <IconButton
                  onClick={(): void => move(index, -1)}
                  disabled={Boolean(disabled) || index === 0}
                  label={formatMessage({ id: `${pluginId}.editor.moveUp`, defaultMessage: 'Move up' })}
                >
                  <ArrowUp />
                </IconButton>
                <IconButton
                  onClick={(): void => move(index, 1)}
                  disabled={Boolean(disabled) || index === items.length - 1}
                  label={formatMessage({ id: `${pluginId}.editor.moveDown`, defaultMessage: 'Move down' })}
                >
                  <ArrowDown />
                </IconButton>
                <IconButton
                  onClick={(): void => remove(index)}
                  disabled={Boolean(disabled)}
                  label={formatMessage({ id: `${pluginId}.editor.remove`, defaultMessage: 'Remove' })}
                >
                  <Trash />
                </IconButton>
              </Flex>
            </Flex>
            <ItemEditor
              uid={item.__component}
              value={item}
              onChange={(partial): void => patch(index, partial)}
              disabled={Boolean(disabled)}
            />
          </Box>
        ))}
      </Box>

      {atMax ? (
        <Box paddingTop={2}>
          <Typography variant="pi" textColor="neutral600">
            {formatMessage({ id: `${pluginId}.editor.atMax`, defaultMessage: 'Maximum number of items reached' })}
          </Typography>
        </Box>
      ) : (
        <Flex justifyContent="center" paddingTop={3}>
          <Button
            variant="secondary"
            startIcon={<Plus />}
            onClick={(): void => setPickerOpen(true)}
            disabled={Boolean(disabled)}
          >
            {formatMessage({ id: `${pluginId}.editor.add`, defaultMessage: 'Add a component' })}
          </Button>
        </Flex>
      )}

      {error && (
        <Box paddingTop={2}>
          <Typography variant="pi" textColor="danger600">
            {error}
          </Typography>
        </Box>
      )}

      {pickerOpen && (
        <ComponentPicker
          allowed={allowed}
          onSelect={add}
          onClose={(): void => setPickerOpen(false)}
        />
      )}
    </Box>
  );
};

export default Input;
