import os
import redis
import json
from dotenv import load_dotenv

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
                
                # TODO: Download repo, Chunk code, Embed with OpenAI, Save to Pinecone
                print("Processing... (pretending to do heavy AI work)")
                
                print(f"[JOB COMPLETE] ID: {job_id}")

        except Exception as e:
            print(f"Error processing job: {e}")
            # Wait a moment before retrying if the connection drops
            import time
            time.sleep(2)

if __name__ == "__main__":
    start_worker()
