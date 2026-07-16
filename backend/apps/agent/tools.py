import os
import asyncio
import base64
import requests
from django.conf import settings

def validate_path(path):
    """
    Enforces absolute realpath safety.
    Verifies that the target path is inside the settings.BASE_DIR workspace.
    """
    base_dir = os.path.realpath(settings.BASE_DIR)
    target_path = os.path.realpath(os.path.join(settings.BASE_DIR, path))
    
    # Check if target_path starts with base_dir prefix
    if not target_path.startswith(base_dir):
        return None, "Access denied (path traversal)"
        
    # Check bounds (e.g. to prevent /path/to/project_other from matching /path/to/project)
    if target_path != base_dir and not target_path.startswith(base_dir + os.sep):
        return None, "Access denied (path traversal)"
        
    return target_path, None

def read_file(path):
    target, err = validate_path(path)
    if err:
        return err
    try:
        if not os.path.exists(target):
            return f"Error: File '{path}' does not exist."
        if not os.path.isfile(target):
            return f"Error: '{path}' is not a file."
        with open(target, 'r', encoding='utf-8', errors='replace') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

def write_file(path, content):
    target, err = validate_path(path)
    if err:
        return err
    try:
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Successfully wrote to '{path}'."
    except Exception as e:
        return f"Error writing file: {str(e)}"

def list_dir(path):
    target, err = validate_path(path)
    if err:
        return err
    try:
        if not os.path.exists(target):
            return f"Error: Directory '{path}' does not exist."
        if not os.path.isdir(target):
            return f"Error: '{path}' is not a directory."
        items = os.listdir(target)
        result = []
        for item in items:
            full_item = os.path.join(target, item)
            is_dir = os.path.isdir(full_item)
            suffix = "/" if is_dir else ""
            result.append(f"{item}{suffix}")
        return "\n".join(result) if result else "(empty directory)"
    except Exception as e:
        return f"Error listing directory: {str(e)}"

async def run_shell(command):
    """
    Runs a shell command relative to settings.BASE_DIR and yields stdout/stderr lines.
    """
    process = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=settings.BASE_DIR
    )
    
    queue = asyncio.Queue()
    
    async def read_stream(stream, stream_type):
        while True:
            line = await stream.readline()
            if not line:
                break
            decoded_line = line.decode('utf-8', errors='replace')
            await queue.put((stream_type, decoded_line))
            
    stdout_task = asyncio.create_task(read_stream(process.stdout, 'stdout'))
    stderr_task = asyncio.create_task(read_stream(process.stderr, 'stderr'))
    
    while not stdout_task.done() or not stderr_task.done() or not queue.empty():
        if not queue.empty():
            stream_type, line = queue.get_nowait()
            yield stream_type, line
        else:
            try:
                stream_type, line = await asyncio.wait_for(queue.get(), timeout=0.1)
                yield stream_type, line
            except asyncio.TimeoutError:
                pass
                
    await asyncio.gather(stdout_task, stderr_task, return_exceptions=True)
    while not queue.empty():
        stream_type, line = queue.get_nowait()
        yield stream_type, line

def github_headers(token):
    if not token:
        return None, "GitHub is not connected."
    return {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
    }, None

def github_error(response):
    if response.status_code == 401:
        return "GitHub token is invalid or expired."
    if response.status_code == 403:
        return "GitHub denied the request. Check token scopes or rate limits."
    if response.status_code == 404:
        return "GitHub repository, branch, or file was not found, or the token has no access."
    return f"GitHub request failed with status {response.status_code}."

def github_list_repositories(token):
    headers, err = github_headers(token)
    if err:
        return err
    try:
        response = requests.get("https://api.github.com/user/repos?per_page=100&sort=updated", headers=headers, timeout=15)
        if not response.ok:
            return github_error(response)
        repos = response.json()
        if not repos:
            return "No GitHub repositories found for this account."
        return "\n".join(
            f"{repo['full_name']} | default: {repo.get('default_branch', 'main')} | private: {repo.get('private', False)}"
            for repo in repos
        )
    except requests.RequestException as exc:
        return f"Error listing GitHub repositories: {exc}"

def github_list_branches(token, repository):
    headers, err = github_headers(token)
    if err:
        return err
    if not repository:
        return "Error: repository is required."
    try:
        response = requests.get(f"https://api.github.com/repos/{repository}/branches?per_page=100", headers=headers, timeout=15)
        if not response.ok:
            return github_error(response)
        branches = response.json()
        return "\n".join(branch["name"] for branch in branches) if branches else "No branches found."
    except requests.RequestException as exc:
        return f"Error listing GitHub branches: {exc}"

def github_read_file(token, repository, path="", ref=None):
    headers, err = github_headers(token)
    if err:
        return err
    if not repository:
        return "Error: repository is required."
    try:
        params = {"ref": ref} if ref else None
        clean_path = (path or "").strip("/")
        url = f"https://api.github.com/repos/{repository}/contents/{clean_path}" if clean_path else f"https://api.github.com/repos/{repository}/contents"
        response = requests.get(url, headers=headers, params=params, timeout=15)
        if not response.ok:
            return github_error(response)
        data = response.json()
        if isinstance(data, list):
            return "\n".join(f"{item['type']}: {item['path']}" for item in data)
        if data.get("encoding") != "base64" or "content" not in data:
            return "GitHub returned unsupported file content."
        return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    except requests.RequestException as exc:
        return f"Error reading GitHub file: {exc}"


def github_write_file(token, repository, path, content, ref=None, message=None):
    """Create or update one file in the selected GitHub repository and branch."""
    headers, err = github_headers(token)
    if err:
        return err
    if not repository:
        return "Error: repository is required."

    clean_path = str(path or "").strip().strip("/")
    if not clean_path or any(part in {"", ".", ".."} for part in clean_path.split("/")):
        return "Error: path must be a safe repository-relative file path."
    if not isinstance(content, str):
        return "Error: content must be a string."

    branch = str(ref or "main").strip() or "main"
    url = f"https://api.github.com/repos/{repository}/contents/{clean_path}"
    try:
        current = requests.get(url, headers=headers, params={"ref": branch}, timeout=15)
        sha = None
        action = "created"
        if current.ok:
            sha = current.json().get("sha")
            if not sha:
                return "GitHub returned an invalid existing file response."
            action = "updated"
        elif current.status_code != 404:
            return github_error(current)

        payload = {
            "message": str(message or f"SEA: {action} {clean_path}")[:200],
            "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
            "branch": branch,
        }
        if sha:
            payload["sha"] = sha

        response = requests.put(url, headers=headers, json=payload, timeout=20)
        if not response.ok:
            return github_error(response)
        return f"Successfully {action} '{clean_path}' on {repository}@{branch}."
    except requests.RequestException as exc:
        return f"Error writing GitHub file: {exc}"
