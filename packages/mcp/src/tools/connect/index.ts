/**
 * Barrel for the connect tool suite.
 *
 * Merges handlers from deploy, status, and update into a single
 * `connectHandlers` map consumed by index.ts, and re-exports the tool
 * definitions for inclusion in the TOOLS array.
 */

export { connectAgentToolDefinition } from './deploy.js';
export { UPDATE_CONNECTION_TOOL } from './update.js';

import { connectHandlers as deployHandlers } from './deploy.js';
import { connectHandlers as statusHandlers } from './status.js';
import { connectHandlers as updateHandlers } from './update.js';

export const connectHandlers = {
  ...deployHandlers,
  ...statusHandlers,
  ...updateHandlers,
};
