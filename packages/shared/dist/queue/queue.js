"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conceptIngestionQueue = exports.CONCEPT_INGESTION_QUEUE = exports.redisConnection = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const bullmq_1 = require("bullmq");
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// ioredis client setup with recommended settings for BullMQ
exports.redisConnection = new ioredis_1.default(redisUrl, {
    maxRetriesPerRequest: null,
});
exports.CONCEPT_INGESTION_QUEUE = 'concept-ingestion';
exports.conceptIngestionQueue = new bullmq_1.Queue(exports.CONCEPT_INGESTION_QUEUE, {
    connection: exports.redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
    },
});
