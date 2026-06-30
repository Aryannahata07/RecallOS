import { Worker, Job } from 'bullmq';
import { redisConnection, CONCEPT_INGESTION_QUEUE, ConceptIngestionJobPayload } from './queue';

export const startIngestionWorker = (
  handler: (job: Job<ConceptIngestionJobPayload>) => Promise<void>
) => {
  const worker = new Worker<ConceptIngestionJobPayload>(
    CONCEPT_INGESTION_QUEUE,
    async (job) => {
      console.log(`[Worker] Starting job ${job.id} | Type: ${job.data.type} | URL: ${job.data.url}`);
      try {
        await handler(job);
        console.log(`[Worker] Job ${job.id} processed successfully`);
      } catch (error) {
        console.error(`[Worker] Error during handler execution on job ${job.id}:`, error);
        throw error; // Re-throw to trigger BullMQ retry logic
      }
    },
    {
      connection: redisConnection as any,
      concurrency: 2, // Concurrency limit to prevent rate-limiting on OpenAI API calls
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} status: Completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} status: Failed | Error:`, err.message);
  });

  return worker;
};
