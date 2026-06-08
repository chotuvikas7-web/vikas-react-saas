import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const serverRoot = path.resolve(__dirname, '..', '..');
export const projectRoot = path.resolve(serverRoot, '..');
export const uploadsRoot = path.resolve(projectRoot, 'uploads');
