import Redis from 'ioredis';
import { Queue } from 'bullmq';
export declare const redisConnection: Redis;
export declare const CONCEPT_INGESTION_QUEUE = "concept-ingestion";
export interface ConceptIngestionJobPayload {
    url: string;
    title: string;
    type: 'youtube' | 'article' | 'leetcode' | 'chat';
    rawContent: string;
    userId: string;
}
export declare const conceptIngestionQueue: Queue<ConceptIngestionJobPayload, any, string, ConceptIngestionJobPayload, any, string>;
