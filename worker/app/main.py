import time
import os
import redis
import json
import signal
import sys
from dotenv import load_dotenv

from core.github_loader import clone_repository, cleanup_repository
from core.chunker import chunk_codebase
from core.vector_store import store_chunks_in_qdrant

load_dotenv()

# Connect to Redis with health checks to prevent socket timeouts
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.Redis.from_url(
    redis_url, 
    decode_responses=True,
    health_check_interval=30,
    socket_keepalive=True,
    retry_on_timeout=True
)

# Global variables to track the active job so the signal handler can clean it up
active_job_id = None
active_github_url = None

def handle_shutdown(signum, frame):
    global active_job_id, active_github_url
    print("\n[SHUTDOWN] Received signal to terminate. Cleaning up...")
    
    if active_job_id:
        print(f"Marking active job {active_job_id} as failed due to shutdown.")
        try:
            redis_client.set(f"job:{active_job_id}", json.dumps({
                "status": "failed",
                "error": "Worker was shut down unexpectedly during processing.",
                "url": active_github_url
            }))
        except Exception:
            pass # Ignore redis errors during shutdown
    raise SystemExit(0)

# Register signal handlers for graceful shutdown (e.g., Docker stop or Ctrl+C)
signal.signal(signal.SIGINT, handle_shutdown)
signal.signal(signal.SIGTERM, handle_shutdown)

def start_worker():
    print("⛑️🧑🏭🧟 Python Worker is starting up...")
    print(f"🔗🔗🔗🔗 Connected to Redis at {redis_url}")
    print("🙉🙉🙉🙉 Listening for jobs on 'ingest_queue'...")

    global active_job_id, active_github_url

    # Infinite loop to keep the worker(daemon processes) running
    while True:
        try:
            # BLPOP = Blocking Left Pop.
            # It waits up to 5 seconds, then returns None if empty.
            # Using 5 instead of 0 to prevent the TCP socket from timing out silently.
            result = redis_client.blpop("ingest_queue", timeout=5)
            
            if result:
                queue_name, job_data_string = result
                job_data = json.loads(job_data_string)
                
                active_job_id = job_data.get("jobId")
                active_github_url = job_data.get("githubUrl")

                print(f"\n[JOB RECEIVED] ID: {active_job_id}")
                print(f"Target URL: {active_github_url}")
                
                repo_path = None
                try:
                    # Step 1: Download the repository
                    repo_path = clone_repository(active_github_url)
                    
                    # Step 2: Chunk the codebase
                    redis_client.set(f"job:{active_job_id}", json.dumps({"status": "chunking"}))
                    chunks = chunk_codebase(repo_path)
                    
                    # Step 3: Embed with OpenAI, Save to Qdrant
                    redis_client.set(f"job:{active_job_id}", json.dumps({"status": "storing"}))
                    store_chunks_in_qdrant(chunks, active_github_url)
                    
                    # Step 4: Tell Node.js we are finished!
                    redis_client.set(f"job:{active_job_id}", json.dumps({
                        "status": "completed",
                        "url": active_github_url
                    }))
                    
                    print("Processing complete. Safely stored in Qdrant!")

                except Exception as e:
                    print(f"Failed to process {active_github_url}: {e}")
                    # Tell Node.js it failed
                    redis_client.set(f"job:{active_job_id}", json.dumps({
                        "status": "failed",
                        "error": str(e),
                        "url": active_github_url
                    }))
                finally:
                    # Always clean up the files so we don't fill up the hard drive!
                    if repo_path:
                        cleanup_repository(repo_path)
                    
                    print(f"[JOB COMPLETE] ID: {active_job_id}")
                    # Reset active job state
                    active_job_id = None
                    active_github_url = None

        except (redis.exceptions.TimeoutError, redis.exceptions.ConnectionError) as e:
            # print(f"[REDIS CONNECTION ERROR] {e}. Attempting to reconnect...")
            time.sleep(5)
        except Exception as e:
            print(f"Error processing job: {e}")
            # Wait a moment before retrying
            time.sleep(2)

if __name__ == "__main__":
    start_worker()
