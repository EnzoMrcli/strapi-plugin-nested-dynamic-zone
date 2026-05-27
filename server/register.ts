/**
 * Register phase — runs synchronously, before any content type is loaded.
 *
 * Two things happen here:
 *   1. We register a custom field of base type `json`. The Content-Type
 *      Builder will then offer it inside the "Custom" tab — for both
 *      content types AND components.
 *   2. We detect direct schema-level cycles at boot.
 */
import type { Core } from '@strapi/strapi';
import {
  FIELD_NAME,
  FIELD_ID,
  PLUGIN_NAME,
  AttributeLike,
  NdzAttribute,
  parseAllowedComponents,
} from './types';

const isNdz = (attr: AttributeLike): attr is NdzAttribute =>
  attr?.type === 'customField' && attr?.customField === FIELD_ID;

function detectCycle(strapi: Core.Strapi): string[] | null {
  const components = (strapi as unknown as { components: Record<string, { attributes: Record<string, AttributeLike> }> }).components;
  if (!components) return null;

  // 3-colour DFS: not-in-map = white (unvisited), GRAY = on stack, BLACK = done
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();

  function visit(uid: string, stack: string[]): string[] | null {
    if (color.get(uid) === GRAY) return [...stack, uid];
    if (color.get(uid) === BLACK) return null;
    color.set(uid, GRAY);
    const schema = components[uid];
    if (schema) {
      for (const attr of Object.values(schema.attributes ?? {})) {
        const targets: string[] = [];
        if (isNdz(attr)) targets.push(...parseAllowedComponents(attr.options?.allowedComponents));
        if (attr.type === 'component' && typeof attr.component === 'string') targets.push(attr.component);
        for (const next of targets) {
          const cycle = visit(next, [...stack, uid]);
          if (cycle) return cycle;
        }
      }
    }
    color.set(uid, BLACK);
    return null;
  }

  for (const uid of Object.keys(components)) {
    const cycle = visit(uid, []);
    if (cycle) return cycle;
  }
  return null;
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.customFields.register({
    name: FIELD_NAME,
    plugin: PLUGIN_NAME,
    type: 'json',
    inputSize: { default: 12, isResizable: false },
  });

  try {
    const cycle = detectCycle(strapi);
    if (cycle) {
      strapi.log.error(
        `[${PLUGIN_NAME}] schema cycle detected: ${cycle.join(' -> ')}. ` +
          'Break the cycle by removing one of the entries from allowedComponents.',
      );
    }
  } catch {
    // Not fatal — bootstrap re-runs this check once everything is loaded.
  }
};
