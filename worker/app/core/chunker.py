from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser
from langchain_text_splitters import Language
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os

def chunk_codebase(repo_path: str):
    """
    Scans the downloaded repository, parses the code, and splits it into chunks.
    """
    print(f"Scanning directory: {repo_path} for code files...")

    # Step 1: The Loader
    # GenericLoader looks through the directory. We restrict it to common code suffixes.
    # The LanguageParser tells it to try and understand the syntax of Python/JS/TS files.
    loader = GenericLoader.from_filesystem(
        repo_path,
        glob="**/*",
        suffixes=[".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".go", ".rs"],
        exclude=["**/node_modules/**", "**/venv/**", "**/.git/**", "**/dist/**", "**/build/**"],
        parser=LanguageParser(),
    )
    
    # Actually execute the loading process
    documents = loader.load()
    print(f"Successfully loaded {len(documents)} code files.")

    # Step 2: The Splitter
    # Using RecursiveCharacterTextSplitter, which tries to split on newlines and spaces 
    # instead of cutting words or functions in half blindly.
    # chunk_size: Max characters per chunk. 2000 is a safe number for embeddings.
    # chunk_overlap: If a concept is cut, repeat 200 characters in the next chunk so context isn't lost.
    python_splitter = RecursiveCharacterTextSplitter.from_language(
        language=Language.PYTHON, chunk_size=2000, chunk_overlap=200
    )
    
    # Execute the splitting process
    print("Splitting files into semantic chunks...")
    chunked_documents = python_splitter.split_documents(documents)
    
    print(f"Created {len(chunked_documents)} total chunks ready for the Vector Database.")
    
    return chunked_documents
