import os
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Optional, Generator

def _build_rag_chain(github_url: str, history: Optional[List[Dict[str, str]]] = None):
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    qdrant_api_key = os.getenv("QDRANT_API_KEY", None)
    client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    
    vector_store = QdrantVectorStore(
        client=client, 
        collection_name="codebase_explainer", 
        embedding=embeddings
    )
    
    retriever = vector_store.as_retriever(
        search_kwargs={
            "k": 8,
            "filter": models.Filter(
                must=[
                    models.FieldCondition(
                        key="metadata.github_url",
                        match=models.MatchValue(value=github_url)
                    )
                ]
            )
        }
    )

    system_prompt = (
        "You are a senior software engineer explaining a codebase to a junior developer. "
        "Use the provided pieces of retrieved code context to answer the question. "
        "If you don't know the answer based on the context, just say you don't know. "
        "Be concise but highly technical. Provide code snippets in your answer if helpful.\n"
        "IMPORTANT: You MUST explicitly mention the folder/file path where you found the answer. "
        "For example: 'According to `src/app.js`...' or 'The syntax is defined in `routes/api.js`...'\n\n"
        "Context:\n{context}"
    )

    chat_history = []
    if history:
        for msg in history:
            if msg.get("role") == "user":
                chat_history.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                chat_history.append(AIMessage(content=msg.get("content", "")))

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])

    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)

    def format_docs(docs):
        formatted_chunks = []
        for doc in docs:
            source_file = doc.metadata.get('source', 'Unknown File')
            language = doc.metadata.get('language', 'unknown')
            chunk_index = doc.metadata.get('chunk_index', 'unknown')
            
            if "temp_repo_" in source_file:
                parts = source_file.replace('\\', '/').split('/')
                try:
                    temp_idx = next(i for i, part in enumerate(parts) if part.startswith("temp_repo_"))
                    source_file = "/".join(parts[temp_idx+1:])
                except StopIteration:
                    pass
            
            header = f"--- FILE PATH: {source_file} | LANGUAGE: {language} | CHUNK INDEX: {chunk_index} ---"
            formatted_chunks.append(f"{header}\n{doc.page_content}")
            
        return "\n\n".join(formatted_chunks)

    rag_chain = (
        RunnablePassthrough.assign(
            context=(lambda x: x["input"]) | retriever | format_docs
        )
        | prompt
        | llm
        | StrOutputParser()
    )
    
    return rag_chain, chat_history

def answer_question(github_url: str, question: str, history: Optional[List[Dict[str, str]]] = None) -> Generator[str, None, None]:
    """
    Generator that yields tokens from the LangChain rag_chain in real-time.
    """
    rag_chain, chat_history = _build_rag_chain(github_url, history)
    
    print(f"Streaming AI answer for: {question}")
    # .stream() yields chunks of text as they arrive from OpenAI
    for chunk in rag_chain.stream({
        "input": question,
        "history": chat_history
    }):
        yield chunk
