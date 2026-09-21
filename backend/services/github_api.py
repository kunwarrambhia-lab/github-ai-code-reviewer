import requests

from backend.config import GITHUB_TOKEN

BASE_URL = "https://api.github.com"

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json"
}


def get_pull_requests(owner: str, repo: str):
    url = f"{BASE_URL}/repos/{owner}/{repo}/pulls?per_page=5"

    response = requests.get(
        url,
        headers=HEADERS,
        timeout=10
    )

    if response.status_code != 200:
        return {"error": response.json()}

    pull_requests = response.json()

    result = []

    for pr in pull_requests:
        result.append({
            "number": pr["number"],
            "title": pr["title"],
            "author": pr["user"]["login"],
            "state": pr["state"],
            "created_at": pr["created_at"]
        })

    return result


def get_pull_request_details(owner: str, repo: str, pr_number: int):
    url = f"{BASE_URL}/repos/{owner}/{repo}/pulls/{pr_number}"

    response = requests.get(
        url,
        headers=HEADERS,
        timeout=10
    )

    if response.status_code != 200:
        return {"error": response.json()}

    pr = response.json()

    return {
        "title": pr["title"],
        "description": pr["body"],
        "author": pr["user"]["login"],
        "state": pr["state"],
        "commits": pr["commits"],
        "changed_files": pr["changed_files"]
    }


def get_pull_request_files(owner: str, repo: str, pr_number: int):
    url = f"{BASE_URL}/repos/{owner}/{repo}/pulls/{pr_number}/files"

    response = requests.get(
        url,
        headers=HEADERS,
        timeout=10
    )

    if response.status_code != 200:
        return {"error": response.json()}

    files = response.json()

    result = []

    for file in files:
        result.append({
            "filename": file["filename"],
            "status": file["status"],
            "additions": file["additions"],
            "deletions": file["deletions"],
            "changes": file["changes"],
            "patch": file.get("patch", "No patch available")
        })

    return result