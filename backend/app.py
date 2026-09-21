from fastapi import FastAPI

from backend.services.github_api import (
    get_pull_requests,
    get_pull_request_details,
    get_pull_request_files
)

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "AI Code Reviewer API"
    }


@app.get("/prs/{owner}/{repo}")
def fetch_prs(owner: str, repo: str):
    return get_pull_requests(owner, repo)


@app.get("/pr/{owner}/{repo}/{pr_number}")
def fetch_pr(owner: str, repo: str, pr_number: int):
    return get_pull_request_details(owner, repo, pr_number)


@app.get("/files/{owner}/{repo}/{pr_number}")
def fetch_pr_files(owner: str, repo: str, pr_number: int):
    return get_pull_request_files(owner, repo, pr_number)