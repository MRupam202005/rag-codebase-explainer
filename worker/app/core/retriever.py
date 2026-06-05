import os
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def answer_question(github_url: str, question: str) -> str:
    """
    1. Connects to Qdrant to find relevant code chunks for the specific github_url.
    2. Injects them into a prompt.
    3. Asks OpenAI (gpt-4o-mini) to answer the user's question based on that context.
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
        "Be concise but highly technical. Provide code snippets in your answer if helpful.\n\n"
        "Context:\n{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    # Initialize the LLM
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)   # temperature = controls the randomness of the LLM's output => 0.2 is low, which means the LLM will be more deterministic and less creative. 

    # Modern LCEL (LangChain Expression Language) Chain!
    # This replaces the legacy create_retrieval_chain and works purely with langchain_core
    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {"context": retriever | format_docs, "input": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    # Execute the chain
    print(f"Asking AI: {question}")
    answer = rag_chain.invoke(question)
    
    return answer
