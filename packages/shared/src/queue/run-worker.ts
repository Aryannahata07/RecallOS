import { startIngestionWorker } from './worker';
import { processIngestionJob } from './processor';

console.log("🚀 Starting RecallOS Background Worker...");
console.log("Listening on BullMQ 'concept-ingestion-queue' for new jobs...");

// Start the worker and pass it the Phase 3 processor we built!
const worker = startIngestionWorker(processIngestionJob);

// Keep the process alive
process.on('SIGINT', async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});
