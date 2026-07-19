import fs from 'fs';
import path from 'path';
import http from 'http';
import { startIngestionWorker } from './worker';
import { processIngestionJob } from './processor';

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

console.log("🚀 Starting RecallOS Background Worker...");
console.log("Listening on BullMQ 'concept-ingestion-queue' for new jobs...");

// Start the worker and pass it the Phase 3 processor we built!
const worker = startIngestionWorker(processIngestionJob);

// Setup a minimal HTTP healthcheck server to satisfy Render's web service health checks
const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  if (req.url === '/healthz' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', worker: 'active' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`📡 Health-check server listening on port ${PORT} to satisfy Render health-checks.`);
});

// Keep the process alive and clean up resources on shutdown
const shutdown = async () => {
  console.log("Shutting down worker and healthcheck server...");
  server.close();
  await worker.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
