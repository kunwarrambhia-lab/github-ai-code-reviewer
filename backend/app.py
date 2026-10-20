
"""
GitHub AI Code Reviewer
FastAPI backend integrating GitHub, ChromaDB, embeddings, and Groq.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq

from backend.config import GROQ_API_KEY
from backend.services.github_api import (
    get_pull_requests,
    get_pull_request_details,
    get_pull_request_files,
)
from backend.services.embeddings import create_embedding
from backend.services.vector_db import (
    index_pull_request,
    search_pull_request,
)
from backend.services.review_engine import review_pull_request
from backend.services.analyzer import analyze_pull_request
from backend.services.chat_engine import chat_with_pull_request


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

MODEL_NAME = "openai/gpt-oss-20b"

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="GitHub AI Code Reviewer",
    version="5.0.0",
    description=(
        "AI-powered GitHub Pull Request Reviewer "
        "using FastAPI, ChromaDB, embeddings, and Groq."
    ),
)


# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# VALIDATION HELPER
# --------------------------------------------------

def validate_pr(owner: str, repo: str, pr_number: int):
    if not owner.strip() or not repo.strip():
        raise HTTPException(
            status_code=400,
            detail="Repository owner and name are required.",
        )

    if pr_number < 1:
        raise HTTPException(
            status_code=400,
            detail="Pull request number must be positive.",
        )


# --------------------------------------------------
# HOME AND HEALTH
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "GitHub AI Code Reviewer API is running!",
        "version": "5.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "groq_key_configured": bool(GROQ_API_KEY),
        "model": MODEL_NAME,
    }


# --------------------------------------------------
# GITHUB PULL REQUESTS
# --------------------------------------------------

@app.get("/prs/{owner}/{repo}")
def fetch_prs(owner: str, repo: str):
    try:
        return get_pull_requests(owner, repo)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch pull requests: {exc}",
        ) from exc


@app.get("/pr/{owner}/{repo}/{pr_number}")
def fetch_pr(owner: str, repo: str, pr_number: int):
    validate_pr(owner, repo, pr_number)

    try:
        return get_pull_request_details(owner, repo, pr_number)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch pull request: {exc}",
        ) from exc


@app.get("/files/{owner}/{repo}/{pr_number}")
def fetch_files(owner: str, repo: str, pr_number: int):
    validate_pr(owner, repo, pr_number)

    try:
        return get_pull_request_files(owner, repo, pr_number)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not fetch pull request files: {exc}",
        ) from exc


# --------------------------------------------------
# EMBEDDING TEST
# --------------------------------------------------

@app.get("/embedding")
def embedding_demo():
    try:
        vector = create_embedding(
            "authentication bug in login function"
        )

        return {
            "success": True,
            "dimensions": len(vector),
            "sample_values": vector[:10],
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Embedding failed: {exc}",
        ) from exc


# --------------------------------------------------
# INDEX A PULL REQUEST
# --------------------------------------------------

@app.post("/index/{owner}/{repo}/{pr_number}")
def index_pr(owner: str, repo: str, pr_number: int):
    validate_pr(owner, repo, pr_number)

    try:
        result = index_pull_request(owner, repo, pr_number)

        if isinstance(result, dict) and result.get("error"):
            raise HTTPException(
                status_code=502,
                detail=result["error"],
            )

        return result

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Pull request indexing failed: {exc}",
        ) from exc


# --------------------------------------------------
# SEMANTIC SEARCH — SELECTED PR ONLY
# --------------------------------------------------

@app.get("/search")
def search(
    query: str = Query(..., min_length=1),
    owner: str = Query(..., min_length=1),
    repo: str = Query(..., min_length=1),
    pr_number: int = Query(..., ge=1),
):
    try:
        results = search_pull_request(
            query=query,
            owner=owner,
            repo=repo,
            pr_number=pr_number,
        )

        count = len(results) if isinstance(results, list) else 0

        return {
            "success": True,
            "query": query,
            "owner": owner,
            "repo": repo,
            "pr_number": pr_number,
            "matches_found": count,
            "results": results,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {exc}",
        ) from exc


# --------------------------------------------------
# AI CODE REVIEW — SELECTED PR ONLY
# --------------------------------------------------

@app.get("/review")
def review(
    query: str = Query(..., min_length=1),
    owner: str = Query(..., min_length=1),
    repo: str = Query(..., min_length=1),
    pr_number: int = Query(..., ge=1),
):
    try:
        result = review_pull_request(
            query=query,
            owner=owner,
            repo=repo,
            pr_number=pr_number,
        )

        return {
            "success": True,
            "query": query,
            "owner": owner,
            "repo": repo,
            "pr_number": pr_number,
            "review": result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Code review failed: {exc}",
        ) from exc


# --------------------------------------------------
# STRUCTURED AI ANALYZER — SELECTED PR ONLY
# --------------------------------------------------

@app.get("/analyze")
def analyze(
    query: str = Query(..., min_length=1),
    owner: str = Query(..., min_length=1),
    repo: str = Query(..., min_length=1),
    pr_number: int = Query(..., ge=1),
):
    try:
        result = analyze_pull_request(
            query=query,
            owner=owner,
            repo=repo,
            pr_number=pr_number,
        )

        return {
            "success": result.get("success", False),
            "query": query,
            "owner": owner,
            "repo": repo,
            "pr_number": pr_number,
            "analysis": result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Pull request analysis failed: {exc}",
        ) from exc


# --------------------------------------------------
# AI CHAT — SELECTED PR ONLY
# --------------------------------------------------

@app.get("/chat")
def chat(
    query: str = Query(..., min_length=1),
    owner: str = Query(..., min_length=1),
    repo: str = Query(..., min_length=1),
    pr_number: int = Query(..., ge=1),
):
    try:
        answer = chat_with_pull_request(
            query=query,
            owner=owner,
            repo=repo,
            pr_number=pr_number,
        )

        return {
            "success": True,
            "query": query,
            "owner": owner,
            "repo": repo,
            "pr_number": pr_number,
            "answer": answer,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Chat request failed: {exc}",
        ) from exc


# --------------------------------------------------
# GROQ CONNECTION TEST
# --------------------------------------------------

@app.get("/groq-test")
def groq_test():
    if groq_client is None:
        return {
            "success": False,
            "model": MODEL_NAME,
            "error": (
                "GROQ_API_KEY is missing. "
                "Check your .env file and backend/config.py."
            ),
        }

    try:
        response = groq_client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Reply only with: "
                        "Groq connection successful."
                    ),
                }
            ],
            temperature=0,
            max_completion_tokens=100,
            reasoning_effort="low",
        )

        message = (
            response.choices[0].message.content
            if response.choices
            else None
        )

        return {
            "success": bool(message),
            "model": MODEL_NAME,
            "response": message,
        }

    except Exception as exc:
        # Do not expose the API key.
        return {
            "success": False,
            "model": MODEL_NAME,
            "error": str(exc),
        }
