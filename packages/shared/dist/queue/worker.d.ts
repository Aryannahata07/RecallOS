import { Worker, Job } from 'bullmq';
import { ConceptIngestionJobPayload } from './queue';
export declare const startIngestionWorker: (handler: (job: Job<ConceptIngestionJobPayload>) => Promise<void>) => Worker<ConceptIngestionJobPayload, any, string>;
