"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startIngestionWorker = void 0;
const bullmq_1 = require("bullmq");
const queue_1 = require("./queue");
const startIngestionWorker = (handler) => {
    const worker = new bullmq_1.Worker(queue_1.CONCEPT_INGESTION_QUEUE, async (job) => {
        console.log(`[Worker] Starting job ${job.id} | Type: ${job.data.type} | URL: ${job.data.url}`);
        try {
            await handler(job);
            console.log(`[Worker] Job ${job.id} processed successfully`);
        }
        catch (error) {
            console.error(`[Worker] Error during handler execution on job ${job.id}:`, error);
            throw error; // Re-throw to trigger BullMQ retry logic
        }
    }, {
        connection: queue_1.redisConnection,
        concurrency: 2, // Concurrency limit to prevent rate-limiting on OpenAI API calls
    });
    worker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} status: Completed`);
    });
    worker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} status: Failed | Error:`, err.message);
    });
    return worker;
};
exports.startIngestionWorker = startIngestionWorker;
