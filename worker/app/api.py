from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from app.core.retriever import answer_question

load_dotenv()

app = FastAPI(title="RAG Codebase Explainer API")

class ChatRequest(BaseModel):
    githubUrl: str
    question: str

@app.post("/chat")
def chat_with_codebase(request: ChatRequest):
    try:
        # Call our LangChain logic
        answer = answer_question(request.githubUrl, request.question)
        return {"answer": answer}
    except Exception as e:
        print(f"Error during chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))
