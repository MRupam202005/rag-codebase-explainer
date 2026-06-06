import os
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, AIMessage
from typing import List, Dict, Optional

def answer_question(github_url: str, question: str, history: Optional[List[Dict[str, str]]] = None) -> str:
    """
    1. Connects to Qdrant to find relevant code chunks for the specific github_url.
    2. Formats previous chat history.
    3. Injects them into a prompt.
    4. Asks OpenAI (gpt-4o-mini) to answer the user's question based on that context.
    """
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    client = QdrantClient(url=qdrant_url)
    
    # Initialize the same embeddings we used to save the data
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    
    # Connect to our existing Qdrant collection
    vector_store = QdrantVectorStore(
        client=client, 
        collection_name="codebase_explainer", 
        embedding=embeddings
    )
    
    # Create a retriever that ONLY searches chunks tagged with this specific GitHub URL
    # We ask for the top 5 most mathematically similar code chunks => why k = 5? ans: depends on the size of the codebase and the complexity of the question.
    # k = the number of chunks to retrieve from the vector database
    # filter = a dictionary to filter the chunks based on metadata
    #   "github_url": github_url => only retrieve chunks that have the same github_url
    retriever = vector_store.as_retriever(
        search_kwargs={
            "k": 5,
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

    # The "Magic" Prompt Injection Template
    system_prompt = (
        "You are a senior software engineer explaining a codebase to a junior developer. "
        "Use the provided pieces of retrieved code context to answer the question. "
        "If you don't know the answer based on the context, just say you don't know. "
        "Be concise but highly technical. Provide code snippets in your answer if helpful.\n"
        "IMPORTANT: You MUST explicitly mention the folder/file path where you found the answer. "
        "For example: 'According to `src/app.js`...' or 'The syntax is defined in `routes/api.js`...'\n\n"
        "Context:\n{context}"
    )

    # Convert raw history dicts into LangChain Message objects
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

    # Initialize the LLM
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)   # temperature = controls the randomness of the LLM's output => 0.2 is low, which means the LLM will be more deterministic and less creative. 

    # Modern LCEL (LangChain Expression Language) Chain!
    # This replaces the legacy create_retrieval_chain and works purely with langchain_core
    def format_docs(docs):
        formatted_chunks = []
        for doc in docs:
            # We extract the file path from the LangChain metadata!
            source_file = doc.metadata.get('source', 'Unknown File')
            
            # CLEAN UP PATH: The loader saves the absolute path (e.g., C:/.../temp_repo_xyz/src/app.js)
            # We must strip the temporary laptop folder so the AI only sees "src/app.js"
            if "temp_repo_" in source_file:
                # Split the path by the OS separator (works for both Windows \\ and Mac/Linux /)
                parts = source_file.replace('\\', '/').split('/')
                try:
                    # Find where the temp_repo folder is, and only keep the folders AFTER it
                    temp_idx = next(i for i, part in enumerate(parts) if part.startswith("temp_repo_"))
                    source_file = "/".join(parts[temp_idx+1:])
                except StopIteration:
                    pass
            
            # We wrap the code chunk in a header so the LLM knows where it came from
            formatted_chunks.append(f"--- FILE PATH: {source_file} ---\n{doc.page_content}")
            
        return "\n\n".join(formatted_chunks)

    rag_chain = (
        RunnablePassthrough.assign(
            context=(lambda x: x["input"]) | retriever | format_docs
        )
        | prompt
        | llm
        | StrOutputParser()
    )

    # Execute the chain
    print(f"Asking AI: {question}")
    answer = rag_chain.invoke({
        "input": question,
        "history": chat_history
    })
    
    return answer
