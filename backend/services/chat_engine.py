
from groq import Groq

from backend.config import GROQ_API_KEY
from backend.services.github_api import get_pull_request_details
from backend.services.vector_db import search_pull_request

MODEL_NAME = "openai/gpt-oss-20b"

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def chat_with_pull_request(
    query: str,
    owner: str,
    repo: str,
    pr_number: int,
):
    if client is None:
        raise RuntimeError(
            "GROQ_API_KEY is not configured. Check your .env file."
        )

    # Fetch the selected pull request.
    details = get_pull_request_details(owner, repo, pr_number)

    # Retrieve relevant indexed code patches.
    matches = search_pull_request(
        query=query,
        owner=owner,
        repo=repo,
        pr_number=pr_number,
        n_results=6,
    )

    # Handle an empty search result.
    if not matches:
        return (
            f"No indexed patches were found for "
            f"{owner}/{repo} PR #{pr_number}. "
            "Index this pull request before asking questions about "
            "its code."
        )

    # Build context from valid patch results.
    context_parts = []

    for item in matches:
        if not isinstance(item, dict):
            continue

        filename = item.get("filename", "Unknown file")
        patch = item.get("patch", "")

        if not patch:
            continue

        context_parts.append(
            f"File: {filename}\nPatch:\n{patch}"
        )

    if not context_parts:
        raise RuntimeError(
            "Search returned results, but none contained usable "
            "code patches. Check vector_db.py and the indexed PR."
        )

    context = "\n\n".join(context_parts)
    title = details.get("title", "Untitled pull request")

    messages = [
        {
            "role": "system",
            "content": (
                "You are an AI assistant for GitHub pull requests. "
                "Answer the user's question directly and clearly. "
                "Use the supplied code patches as evidence. "
                "For potential bugs, explain the relevant code path, "
                "the possible failure, and why it matters. "
                "Distinguish confirmed bugs from unverified risks. "
                "Do not invent code or claim you inspected files "
                "that were not supplied. If the evidence is "
                "insufficient, say so and explain what is missing. "
                "Always provide a user-facing answer."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Repository: {owner}/{repo}\n"
                f"Pull request: #{pr_number}\n"
                f"Title: {title}\n\n"
                f"Retrieved code patches:\n{context}\n\n"
                f"Question: {query}\n\n"
                "Give a concise but useful answer based on the "
                "available evidence."
            ),
        },
    ]

    # Try twice in case the model returns empty answer content.
    for attempt in range(2):
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.2,
            max_completion_tokens=2500,
            reasoning_effort="low",
        )

        if not response.choices:
            continue

        choice = response.choices[0]
        content = choice.message.content

        if isinstance(content, str) and content.strip():
            return content.strip()

    raise RuntimeError(
        "Groq returned no usable answer after two attempts. "
        "Check the model response, token limits, and Groq API status."
    )
