# RecallOS Deployment Architecture Guide

RecallOS is designed as a modular, decoupled application to optimize performance and reduce hosting costs. Below is the complete overview of where each service is deployed, how they communicate, and how to configure them.

---

## 1. Hosting Services Summary

| Component | Provider | URL / Host | Description |
| :--- | :--- | :--- | :--- |
| **Web App & Dashboard** | **Vercel** | `https://recall-os-web.vercel.app/` | Serves the Next.js frontend, dashboards, NextAuth session endpoints, and API ingestion points. |
| **Background Worker** | **Render** | `recallos-worker` (Service) | A dedicated, long-running Node.js process that polls BullMQ for ingestion jobs, calls LLMs, and updates database records. |
| **Database (PostgreSQL)** | **Supabase** | `aws-0-ap-southeast-1.pooler.supabase.com` | Relational database hosting Postgres. Scoped to port `6543` for connection pooling. |
| **Queue Manager (Redis)** | **Upstash** | `verified-duck-175434.upstash.io` | Serverless Redis instance running BullMQ. Serves as the bridge between Vercel and Render. |
| **Vector Search DB** | **Typesense** | *TBD for Production* (Currently Local) | Powers semantic deduplication. Gracefully degrades if unavailable. |

---

## 2. Why is the App Split This Way?

* **Vercel (Web App)**: Next.js runs best on Vercel. Frontend rendering, page transitions, and serverless API endpoints are fast, responsive, and scale automatically.
* **Render (Background Worker)**: Next.js serverless functions have execution time limits (10–60s) and cannot run background loops or listen to polling queues permanently. The worker needs a **persistent, long-running Node.js process** to continuously poll BullMQ and make long LLM extraction calls without timing out.
* **Upstash (Redis)**: Acts as the communication bridge. When a user clicks capture, Vercel pushes a lightweight job to Upstash Redis. The Render worker, which is constantly listening to Upstash, picks it up, runs the extraction, and writes the results back to the Supabase database.

---

## 3. Environment Variables Checklist

Ensure these variables are configured correctly on both platforms.

| Variable | Required on Vercel | Required on Render | Purpose |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | **Yes** | **Yes** | Connection string for Supabase PostgreSQL. |
| `REDIS_URL` | **Yes** | **Yes** | Connection string for Upstash Redis. |
| `AUTH_SECRET` | **Yes** | No | Secret key used by NextAuth to sign JWT tokens. |
| `LLM_PROVIDER` | **Yes** | **Yes** | `"groq"` \| `"gemini"` \| `"openai"` |
| `GROQ_API_KEY` | **Yes** (if using Groq) | **Yes** (if using Groq) | API key for Groq LLM concept extraction. |
| `GEMINI_API_KEY` | **Yes** | **Yes** | Gemini API key (used for embeddings & fallback). |
| `TYPESENSE_HOST` | **Yes** | **Yes** | Hostname of Typesense instance (defaults to `"localhost"`). |
| `TYPESENSE_API_KEY` | **Yes** | **Yes** | API key for Typesense (defaults to `"xyz123api"`). |

> [!IMPORTANT]
> **Check Render Environment Variables:** 
> The recent concept extraction crash occurred because `GROQ_API_KEY` (or `GEMINI_API_KEY`) was not added to the **Environment Settings** of your `recallos-worker` service in the Render Dashboard. Make sure to paste all keys from your local `.env` file into the Render console!

---

## 4. Typesense Production Setup

Currently, Typesense is running locally via Docker. In production:
1. You can spin up a **Typesense Cloud** instance or deploy a Typesense Docker container on a hosting provider (like Render or AWS).
2. Update the `TYPESENSE_HOST`, `TYPESENSE_PORT`, `TYPESENSE_PROTOCOL`, and `TYPESENSE_API_KEY` environment variables on **both Vercel and Render**.
3. **Graceful Failure**: If Typesense is not yet deployed or configured in production, the background worker will log a `[Typesense Index Warning]` and skip vector deduplication, but it **will still successfully extract concepts and save them to PostgreSQL**.

---

## 5. How to Fix the Missing Concepts on Dashboard

Since the background worker on Render crashed due to missing API keys while processing your RAG article job, the job failed, and the database concepts were never created.

Once you:
1. Add the missing LLM API keys to your **Render Dashboard** environment settings.
2. Push our updated code to deploy the fixes.
3. Delete the captured source from your Dashboard and **re-capture it using the Chrome extension**.

The worker will run the job again, call the LLM successfully, and extract the concepts onto your dashboard!
