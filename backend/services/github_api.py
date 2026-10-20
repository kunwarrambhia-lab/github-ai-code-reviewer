
import requests

from backend.config import GITHUB_TOKEN

BASE_URL = "https://api.github.com"

HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"


def _github_get(url: str, params=None):
    response = requests.get(
        url,
        headers=HEADERS,
        params=params,
        timeout=30,
    )

    if not response.ok:
        try:
            detail = response.json()
        except ValueError:
            detail = response.text

        raise RuntimeError(
            f"GitHub API error {response.status_code}: {detail}"
        )

    return response.json()


def get_pull_requests(owner: str, repo: str):
    url = f"{BASE_URL}/repos/{owner}/{repo}/pulls"

    prs = _github_get(
        url,
        params={"per_page": 10, "state": "open"},
    )

    return [
        {
            "number": pr["number"],
            "title": pr["title"],
            "author": pr["user"]["login"],
            "state": pr["state"],
            "created_at": pr["created_at"],
            "html_url": pr["html_url"],
        }
        for pr in prs
    ]


def get_pull_request_details(owner: str, repo: str, pr_number: int):
    url = (
        f"{BASE_URL}/repos/{owner}/{repo}"
        f"/pulls/{pr_number}"
    )

    pr = _github_get(url)

    return {
        "number": pr["number"],
        "title": pr["title"],
        "description": pr["body"] or "",
        "author": pr["user"]["login"],
        "state": pr["state"],
        "commits": pr["commits"],
        "changed_files": pr["changed_files"],
        "html_url": pr["html_url"],
        "base_branch": pr["base"]["ref"],
        "head_branch": pr["head"]["ref"],
    }


def get_pull_request_files(owner: str, repo: str, pr_number: int):
    url = (
        f"{BASE_URL}/repos/{owner}/{repo}"
        f"/pulls/{pr_number}/files"
    )

    files = []
    page = 1

    while True:
        batch = _github_get(
            url,
            params={"per_page": 100, "page": page},
        )

        files.extend(
            {
                "filename": item["filename"],
                "status": item["status"],
                "additions": item["additions"],
                "deletions": item["deletions"],
                "changes": item["changes"],
                "patch": item.get("patch") or "",
            }
            for item in batch
        )

        if len(batch) < 100:
            break

        page += 1

    return files
