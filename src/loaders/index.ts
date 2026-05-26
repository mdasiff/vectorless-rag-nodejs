import { config } from '../config.js';
import type { Loader } from '../types.js';
import { jsonLoader } from './jsonLoader.js';

export function loader(): Loader {
  switch (config.dataSource) {
    case 'json':
      return jsonLoader(config.dataPath);
    case 'servicenow':
      throw new Error('ServiceNow loader not implemented yet');
    default:
      throw new Error(`Unknown data source: ${config.dataSource}`);
  }
}
