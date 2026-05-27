/**
 * Modal that lets the editor pick which component type to add.
 */
import * as React from 'react';
import { useIntl } from 'react-intl';
import { Modal, Box, Button, Typography, Flex } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { loadComponentSchema } from '../../utils/schema-loader';
import pluginId from '../../pluginId';

interface ComponentPickerProps {
  allowed: string[];
  onSelect: (uid: string) => void;
  onClose: () => void;
}

interface LabelMap {
  [uid: string]: { displayName?: string; icon?: string };
}

const ComponentPicker: React.FC<ComponentPickerProps> = ({ allowed, onSelect, onClose }) => {
  const { formatMessage } = useIntl();
  const client = useFetchClient();
  const [labels, setLabels] = React.useState<LabelMap>({});

  React.useEffect(() => {
    let alive = true;
    void Promise.all(
      allowed.map(async (uid) => {
        try {
          const schema = await loadComponentSchema(uid, client);
          return [uid, schema.info ?? {}] as const;
        } catch {
          return [uid, {}] as const;
        }
      }),
    ).then((entries) => {
      if (!alive) return;
      const next: LabelMap = {};
      for (const [uid, info] of entries) next[uid] = info;
      setLabels(next);
    });
    return (): void => { alive = false; };
  }, [allowed, client]);

  return (
    <Modal.Root open onOpenChange={(open): void => { if (!open) onClose(); }}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>
            {formatMessage({ id: `${pluginId}.picker.title`, defaultMessage: 'Pick a component' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {allowed.length === 0 ? (
            <Typography textColor="neutral600">
              {formatMessage({
                id: `${pluginId}.picker.empty`,
                defaultMessage: 'No components are allowed here. Configure the field\'s allowedComponents option.',
              })}
            </Typography>
          ) : (
            <Flex direction="column" gap={2} alignItems="stretch">
              {allowed.map((uid) => {
                const label = labels[uid]?.displayName ?? uid;
                return (
                  <Button
                    key={uid}
                    variant="tertiary"
                    fullWidth
                    onClick={(): void => onSelect(uid)}
                  >
                    <Box style={{ textAlign: 'left', width: '100%' }}>
                      <Typography fontWeight="bold">{label}</Typography>
                      <Typography variant="pi" textColor="neutral600">
                        {uid}
                      </Typography>
                    </Box>
                  </Button>
                );
              })}
            </Flex>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {formatMessage({ id: `${pluginId}.picker.cancel`, defaultMessage: 'Cancel' })}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};

export default ComponentPicker;
