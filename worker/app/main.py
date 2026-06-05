import time
import os
# pyrefly: ignore [missing-import]
import redis
import json
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

from core.github_loader import clone_repository, cleanup_repository
from core.chunker import chunk_codebase

load_dotenv()

# Connect to Redis with health checks to prevent socket timeouts
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.Redis.from_url(
    redis_url, 
    decode_responses=True,
    health_check_interval=30
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
                    chunks = chunk_codebase(repo_path)
                    
                    # TODO: Step 3: Embed with OpenAI, Save to Pinecone
                    print("Processing complete. Ready for Vector DB!")
                    
                except Exception as e:
                    print(f"Failed to process {github_url}: {e}")
                finally:
                    # Always clean up the files so we don't fill up the hard drive!
                    if repo_path:
                        cleanup_repository(repo_path)
                
                print(f"[JOB COMPLETE] ID: {job_id}")

        except Exception as e:
            print(f"Error processing job: {e}")
            # Wait a moment before retrying if the connection drops
            time.sleep(2)

if __name__ == "__main__":
    start_worker()
