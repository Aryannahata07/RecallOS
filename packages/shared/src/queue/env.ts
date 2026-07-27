import fs from 'fs';
import path from 'path';

// Load .env files manually if they exist (for local development)
const pathsToTry = [
  path.resolve(__dirname, '../../../../.env'), // root .env
  path.resolve(__dirname, '../../.env'),       // shared package .env
];

pathsToTry.forEach(envPath => {
  if (fs.existsSync(envPath)) {
    console.log(`[Worker] Loading local environment variables from ${envPath}`);
    try {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split(/\r?\n/).forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          if (process.env[key] === undefined) {
            process.env[key] = value.trim();
          }
        }
      });
    } catch (e) {
      console.warn(`[Worker] Failed to parse env file at ${envPath}:`, e);
    }
  }
});
