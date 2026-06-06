from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv
from app.core.retriever import answer_question

load_dotenv()

app = FastAPI(title="RAG Codebase Explainer API")

class ChatRequest(BaseModel):
    githubUrl: str
    question: str
    history: Optional[List[Dict[str, str]]] = []


@app.post("/chat")
def chat_with_codebase(request: ChatRequest):
    try:
        # FastAPI handles generators natively via StreamingResponse
        # media_type="text/event-stream" tells the client it's an SSE connection
        generator = answer_question(request.githubUrl, request.question, request.history)
        return StreamingResponse(generator, media_type="text/event-stream")
    except Exception as e:
        print(f"Error during stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))
