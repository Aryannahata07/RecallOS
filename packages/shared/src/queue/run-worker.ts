import './env';
import http from 'http';
import { startIngestionWorker } from './worker';
import { processIngestionJob } from './processor';

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
