import os
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

def store_chunks_in_qdrant(chunks, github_url: str):
    """
    Takes a list of code chunks, generates OpenAI embeddings, 
    and saves them into the local Qdrant Vector Database.
    """
    print(f"Connecting to Qdrant Database...")
    
    # 1. Initialize the Qdrant Client (running locally via Docker or remotely via Cloud)
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY", None)
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    
    # Define our collection (table) name
    collection_name = "codebase_explainer"
    
    # 2. Initialize OpenAI Embeddings
    # This automatically grabs OPENAI_API_KEY from .env
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    
    # 3. Attach metadata to chunks so we can filter by github_url later
    for chunk in chunks:
        chunk.metadata["github_url"] = github_url
        
    print(f"Generating embeddings and uploading {len(chunks)} chunks to Qdrant...")
    
    # 4. Upsert into Qdrant
    # The `from_documents` method automatically:
    #   - Checks if the collection exists, creates it if not (with the correct 1536 dimension size)
    #   - Calls OpenAI to generate vectors for the text
    #   - Uploads everything to the DB
    QdrantVectorStore.from_documents(
        chunks,
        embeddings,
        url=qdrant_url,
        api_key=qdrant_api_key,
        collection_name=collection_name,
    )
    
    print("Upload complete!")
