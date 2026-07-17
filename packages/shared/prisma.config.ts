import { defineConfig } from 'prisma/config';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env if running via CLI
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
} else {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(rootEnvPath);
  }
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@127.0.0.1:5433/recallos_db?schema=public',
  },
});
