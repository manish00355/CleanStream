import asyncio
import signal
import httpx
from dataclasses import asdict
from bullmq import Worker, Job

from config import REDIS_URL, QUEUE_NAME
from schemas import ModerationJobInput
from tasks.moderate import run_moderation

BACKEND_CALLBACK_URL = "http://localhost:5000/api/moderation/ml-callback"

async def process(job: Job, job_token: str):
    print(f"\n[Worker] Received job: {job.id}")
    print(f"[Worker] Data: {job.data}")

    try:
        mod_input = ModerationJobInput(
            job_id    = job.data.get("job_id", job.id),
            post_id   = job.data.get("post_id", ""),
            text      = job.data.get("text") or None,
            image_url = job.data.get("image_url") or None,
        )

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_moderation, mod_input)

        print(f"[Worker] Done: {result.final_verdict} | reasons: {result.flag_reasons}")

        # ── HTTP callback to Node.js backend ─────────────────────────────────
        callback_payload = {
            "job_id":        result.job_id,
            "post_id":       result.post_id,
            "final_verdict": result.final_verdict,
            "flag_reasons":  result.flag_reasons,
            "processing_ms": result.processing_ms,
            "text_result":   asdict(result.text_result)   if result.text_result   else None,
            "image_result":  asdict(result.image_result)  if result.image_result  else None,
            "misinfo_result":asdict(result.misinfo_result) if result.misinfo_result else None,
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(BACKEND_CALLBACK_URL, json=callback_payload, timeout=10)
            print(f"[Worker] Callback → {resp.status_code}")

        return {
            "final_verdict": result.final_verdict,
            "flag_reasons":  result.flag_reasons,
            "processing_ms": result.processing_ms,
        }

    except Exception as e:
        print(f"[Worker] ERROR processing job {job.id}: {e}")
        import traceback
        traceback.print_exc()
        raise


async def main():
    shutdown_event = asyncio.Event()

    def signal_handler(sig, frame):
        print(f"\n[Worker] Signal received ({sig}), shutting down...")
        shutdown_event.set()

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT,  signal_handler)

    worker = Worker(
        QUEUE_NAME,
        process,
        {
            "connection": REDIS_URL,
            "concurrency": 2,
        }
    )

    print(f"[Worker] Listening on queue '{QUEUE_NAME}' at {REDIS_URL}")
    print(f"[Worker] Waiting for jobs...\n")

    await shutdown_event.wait()

    print("[Worker] Closing worker...")
    await worker.close()
    print("[Worker] Shut down cleanly.")


if __name__ == "__main__":
    asyncio.run(main())