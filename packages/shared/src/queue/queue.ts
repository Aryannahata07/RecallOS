import Redis from 'ioredis';
import { Queue } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// ioredis client setup with recommended settings for BullMQ
export const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const CONCEPT_INGESTION_QUEUE = 'concept-ingestion';

export interface ConceptIngestionJobPayload {
  url: string;
  title: string;
  type: 'youtube' | 'article' | 'leetcode' | 'chat';
  rawContent: string;
  userId: string;
}

export const conceptIngestionQueue = new Queue<ConceptIngestionJobPayload>(CONCEPT_INGESTION_QUEUE, {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
  },
});
