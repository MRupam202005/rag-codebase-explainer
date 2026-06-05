import os
import shutil
import subprocess
from uuid import uuid4

def clone_repository(github_url: str) -> str:
    """
    Clones a public GitHub repository to a local temporary directory.
    Returns the path to the cloned directory.
    """
    # Create a unique directory name for this repo
    temp_dir = os.path.join(os.getcwd(), f"temp_repo_{uuid4().hex[:8]}")
    
    print(f"Cloning {github_url} into {temp_dir}...")
    
    try:
        # Run the git clone command
        subprocess.run(
            ["git", "clone", github_url, temp_dir],
            check=True,
            stdout=subprocess.DEVNULL, # Hide normal git output
            stderr=subprocess.PIPE     # Capture errors if it fails
        )
        print("Clone successful!")
        return temp_dir
    except subprocess.CalledProcessError as e:
        print(f"Failed to clone repository: {e.stderr.decode()}")
        raise Exception(f"Failed to clone repository: {github_url}")

def cleanup_repository(repo_path: str):
    """
    Deletes the temporary repository directory to save disk space.
    """
    if os.path.exists(repo_path):
        print(f"Cleaning up {repo_path}...")
        # On Windows, sometimes git leaves files read-only. 
        # For a robust cleanup, shutil.rmtree might need an error handler,
        # but for this step, a standard rmtree works fine.
        shutil.rmtree(repo_path, ignore_errors=True)
        print("Cleanup complete.")
