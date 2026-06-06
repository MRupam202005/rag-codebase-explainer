import time
import os
# pyrefly: ignore [missing-import]
import redis
import json
# pyrefly: ignore [missing-import]
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

def start_worker():
    print("⛑️🧑🏭🧟 Python Worker is starting up...")
    print(f"🔗🔗🔗🔗 Connected to Redis at {redis_url}")
    print("🙉🙉🙉🙉 Listening for jobs on 'ingest_queue'...")

    # Infinite loop to keep the worker running
    while True:
        try:
            # BLPOP = Blocking Left Pop. 
            # It waits up to 5 seconds, then returns None if empty.
            # We use 5 instead of 0 to prevent the TCP socket from timing out silently.
            result = redis_client.blpop("ingest_queue", timeout=5)
            
            if result:
                queue_name, job_data_string = result
                job_data = json.loads(job_data_string)
                
                job_id = job_data.get("jobId")
                github_url = job_data.get("githubUrl")

                print(f"\n[JOB RECEIVED] ID: {job_id}")
                print(f"Target URL: {github_url}")
                
                repo_path = None
                try:
                    # Step 1: Download the repository
                    repo_path = clone_repository(github_url)
                    
                    # Step 2: Chunk the codebase
                    redis_client.set(f"job:{job_id}", json.dumps({"status": "chunking"}))
                    chunks = chunk_codebase(repo_path)
                    
                    # Step 3: Embed with OpenAI, Save to Qdrant
                    redis_client.set(f"job:{job_id}", json.dumps({"status": "storing"}))
                    store_chunks_in_qdrant(chunks, github_url)
                    
                    # Step 4: Tell Node.js we are finished!
                    redis_client.set(f"job:{job_id}", json.dumps({
                        "status": "completed",
                        "url": github_url
                    }))
                    
                    # CACHE UPDATE: Mark this repo as processed globally so we don't duplicate it later!
                    redis_client.hset("processed_repos", github_url, "true")
                    
                    print("Processing complete. Safely stored in Qdrant!")
                    
                except Exception as e:
                    print(f"Failed to process {github_url}: {e}")
                    # Tell Node.js it failed
                    redis_client.set(f"job:{job_id}", json.dumps({
                        "status": "failed",
                        "error": str(e),
                        "url": github_url
                    }))
                finally:
                    # Always clean up the files so we don't fill up the hard drive!
                    if repo_path:
                        cleanup_repository(repo_path)
                
                print(f"[JOB COMPLETE] ID: {job_id}")

        except (redis.exceptions.TimeoutError, redis.exceptions.ConnectionError) as e:
            print(f"[REDIS CONNECTION ERROR] {e}. Attempting to reconnect...")
            time.sleep(5)
        except Exception as e:
            print(f"Error processing job: {e}")
            # Wait a moment before retrying
            time.sleep(2)

if __name__ == "__main__":
    start_worker()
