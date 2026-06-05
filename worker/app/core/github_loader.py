import os
import stat
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

def remove_readonly(func, path, _):
    """Clear the readonly bit and reattempt the removal."""
    os.chmod(path, stat.S_IWRITE)
    func(path)

def cleanup_repository(repo_path: str):
    """
    Deletes the temporary repository directory to save disk space.
    """
    if os.path.exists(repo_path):
        print(f"Cleaning up {repo_path}...")
        # On Windows, Git creates read-only files in the .git folder.
        # We must use an 'onerror' handler to change permissions before deleting.
        shutil.rmtree(repo_path, onerror=remove_readonly)
        print("Cleanup complete.")
