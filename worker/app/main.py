import os
import redis
import json
from dotenv import load_dotenv

load_dotenv()

# Connect to Redis (Notice the port is the same one our Node.js server uses)
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.Redis.from_url(redis_url, decode_responses=True)

def start_worker():
    print("⛑️🧑🏭🧟 Python Worker is starting up...")
    print(f"🔗🔗🔗🔗 Connected to Redis at {redis_url}")
    print("🙉🙉🙉🙉 Listening for jobs on 'ingest_queue'...")

    # Infinite loop to keep the worker running
    while True:
        try:
            # BLPOP = Blocking Left Pop. 
            # It waits until an item is added to the queue, then pops it off.
            # Timeout=0 means it will wait forever without disconnecting.
            result = redis_client.blpop("ingest_queue", timeout=0)
            
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

if __name__ == "__main__":
    start_worker()
