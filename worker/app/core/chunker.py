from langchain_community.document_loaders.generic import GenericLoader
from langchain_community.document_loaders.parsers import LanguageParser
from langchain_text_splitters import Language
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import os
import tiktoken

# Define standard OpenAI encoder for token counting (cl100k_base used by text-embedding-3 and GPT-4)
tokenizer = tiktoken.get_encoding("cl100k_base")

def tiktoken_len(text):
    tokens = tokenizer.encode(text, disallowed_special=())
    return len(tokens)

# Map file extensions to their corresponding LangChain Language Enum
EXTENSION_TO_LANGUAGE = {
    ".py": Language.PYTHON,
    ".js": Language.JS,
    ".jsx": Language.JS,
    ".ts": Language.TS,
    ".tsx": Language.TS,
    ".java": Language.JAVA,
    ".cpp": Language.CPP,
    ".go": Language.GO,
    ".rs": Language.RUST,
}

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

    # Step 2: Organize and Split
    # Group documents by their programming language
    docs_by_language = {}
    for doc in documents:
        # Extract extension
        file_path = doc.metadata.get("source", "")
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        
        # Inject standard metadata
        doc.metadata["file_extension"] = ext
        
        lang = EXTENSION_TO_LANGUAGE.get(ext)
        if lang:
            doc.metadata["language"] = lang.value
        else:
            doc.metadata["language"] = "unknown"
            
        if lang not in docs_by_language:
            docs_by_language[lang] = []
        docs_by_language[lang].append(doc)
        
    chunked_documents = []
    
    print("Splitting files into semantic, token-based chunks...")
    for lang, docs in docs_by_language.items():
        if lang:
            # Use syntax-aware splitter for known languages
            splitter = RecursiveCharacterTextSplitter.from_language(
                language=lang, 
                chunk_size=500,  # Token limit per chunk
                chunk_overlap=50, # Token overlap
                length_function=tiktoken_len
            )
        else:
            # Fallback normal text splitter for unknown languages
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=500, 
                chunk_overlap=50,
                length_function=tiktoken_len
            )
            
        chunks = splitter.split_documents(docs)
        chunked_documents.extend(chunks)
        
    # Inject chunk_index metadata to maintain sequential order context
    for i, chunk in enumerate(chunked_documents):
        chunk.metadata["chunk_index"] = i
    
    # Generate and inject the Repository Map as a special chunk
    repo_map_str = generate_repo_map(repo_path)
    map_document = Document(
        page_content=repo_map_str,
        metadata={"source": "repository_architecture_map.txt"}
    )
    # Insert it to the chunked_documents
    chunked_documents.insert(0, map_document)
    
    print(f"Created {len(chunked_documents)} total chunks ready for the Vector Database.")
    
    return chunked_documents
