import requests

BASE_URL = "https://api.github.com"

def get_pull_requests(owner: str, repo: str):
    url = f"{BASE_URL}/repos/{owner}/{repo}/pulls?per_page=5"

    response = requests.get(url, timeout=10)

    if response.status_code != 200:
        return {"error": f"GitHub returned {response.status_code}"}

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