import os
import stat
import shutil
import subprocess
import tempfile

def clone_repository(github_url: str) -> str:
    """
    Clones a public GitHub repository to a local temporary directory.
    Returns the path to the cloned directory.
    """
    # Create a unique directory name for this repo in the OS's temp directory
    temp_dir = tempfile.mkdtemp(prefix="temp_repo_")
    
    print(f"Cloning {github_url} into {temp_dir}...")
    
    try:
        # Run the git clone command with --depth 1 to only download the latest commit (saves massive time and space)
        subprocess.run(
            ["git", "clone", "--depth", "1", github_url, temp_dir],
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
        # Use an 'onerror' handler to change permissions before deleting.
        shutil.rmtree(repo_path, onerror=remove_readonly)
        print("Cleanup complete.")
