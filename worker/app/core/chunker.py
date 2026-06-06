from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser
from langchain_text_splitters import Language
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import os

def generate_repo_map(repo_path: str) -> str:
    """Generates a text-based tree map of the repository structure."""
    tree_str = "📁 REPOSITORY ARCHITECTURE MAP:\nThis file contains the complete folder structure of the project. Use this to answer questions about where files are located, where the entry point is, or how the project is organized architecturally.\n\n"
    
    ignore_dirs = {".git", "node_modules", "venv", "dist", "build", "__pycache__", "coverage"}
    
    for root, dirs, files in os.walk(repo_path):
        # Mutate dirs in place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith('.')]
        
        level = root.replace(repo_path, '').count(os.sep)
        indent = ' ' * 4 * level
        basename = os.path.basename(root)
        
        if level == 0:
            tree_str += f"root/\n"
        else:
            tree_str += f"{indent}├── {basename}/\n"
            
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            # Ignore hidden files or very common irrelevant files
            if not f.startswith('.') and not f.endswith('.lock'):
                tree_str += f"{subindent}├── {f}\n"
            
    return tree_str

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

    # SAFETY CHECK: Prevent massive repositories from draining the OpenAI API credits
    if len(documents) > 1000:
        raise Exception(f"Repository too large ({len(documents)} files). Maximum allowed is 1000 files to protect API credits.")

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
    
    # Generate and inject the Repository Map as a special chunk
    repo_map_str = generate_repo_map(repo_path)
    map_document = Document(
        page_content=repo_map_str,
        metadata={"source": "repository_architecture_map.txt"}
    )
    # Insert it at the beginning so it has high priority
    chunked_documents.insert(0, map_document)
    
    print(f"Created {len(chunked_documents)} total chunks ready for the Vector Database.")
    
    return chunked_documents
