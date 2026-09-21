from fastapi import FastAPI
from backend.services.github_api import get_pull_requests

app = FastAPI(
    title="GitHub AI Code Reviewer",
    version="1.0.0"
)

@app.get("/")
def home():
    return {
        "message": "GitHub AI Code Reviewer API is running!"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

@app.get("/prs/{owner}/{repo}")
def fetch_prs(owner: str, repo: str):
    return get_pull_requests(owner, repo)