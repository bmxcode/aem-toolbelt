// Register every enhancer, then start the runner.
// To add a new console fix: create ./<name>.js that calls register(...), then import it here.

import './remove-from-folder.js';
import './shared-links.js';
import './metadata-schema-list.js';

import { start } from '../core/runner.js';

start();
