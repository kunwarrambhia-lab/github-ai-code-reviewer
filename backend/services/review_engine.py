
from groq import Groq

from backend.config import GROQ_API_KEY
from backend.services.github_api import (
    get_pull_request_details,
)
from backend.services.vector_db import search_pull_request

MODEL_NAME = "openai/gpt-oss-20b"

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def review_pull_request(
    query: str,
    owner: str,
    repo: str,
    pr_number: int,
):
    if client is None:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    details = get_pull_request_details(owner, repo, pr_number)

    matches = search_pull_request(
        query=(
            f"{query}\n"
            f"Review pull request #{pr_number} in {owner}/{repo}"
        ),
        owner=owner,
        repo=repo,
        pr_number=pr_number,
        n_results=10,
    )

    if not matches:
        return (
            f"No indexed code patches were found for "
            f"{owner}/{repo} PR #{pr_number}. "
            "Index the pull request first. GitHub may omit patches "
            "for some files, so zero indexed patches does not mean "
            "the pull request contains no changes."
        )

    context = "\n\n".join(
        (
            f"File: {item['filename']}\n"
            f"Status: {item['status']}\n"
            f"Patch:\n{item['patch']}"
        )
        for item in matches
    )

    prompt = f"""
You are an experienced software engineer reviewing a GitHub pull request.

Repository: {owner}/{repo}
Pull request: #{pr_number}
Title: {details['title']}
Description: {details['description']}

User's review request:
{query}

Retrieved changed-file patches:
{context}

Review requirements:
- Base findings only on evidence in the supplied patches.
- Do not invent functions, imports, or lines that are not shown.
- Separate confirmed defects from possible risks.
- Do not claim the whole pull request was reviewed if only some patches
  were retrieved.
- Do not call a missing symbol a bug unless the provided evidence
  supports that conclusion.
- Explain security, correctness, performance, and maintainability
  concerns where relevant.
- If no issue is supported by the evidence, say so clearly.
- Give a cautious recommendation: Approve, Request changes, or
  Needs human review.
- State the limits of this review.

Return Markdown with:
1. Summary
2. Files and evidence reviewed
3. Confirmed bugs
4. Potential risks
5. Security
6. Performance
7. Recommendation
"""

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        max_completion_tokens=3000,
    )

    return response.choices[0].message.content or (
        "The model did not return a review."
    )
