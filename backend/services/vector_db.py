
import chromadb

from backend.services.embeddings import create_embedding
from backend.services.github_api import (
    get_pull_request_details,
    get_pull_request_files,
)

client = chromadb.PersistentClient(path="backend/chroma_db")

collection = client.get_or_create_collection(
    name="pull_request_patches"
)


def index_pull_request(owner: str, repo: str, pr_number: int):
    # Validate the PR first.
    details = get_pull_request_details(owner, repo, pr_number)

    if not isinstance(details, dict) or "number" not in details:
        raise RuntimeError("Could not retrieve the selected pull request.")

    files = get_pull_request_files(owner, repo, pr_number)

    if not isinstance(files, list):
        raise RuntimeError("GitHub returned invalid pull request files.")

    metadata_filter = {
        "$and": [
            {"owner": {"$eq": owner}},
            {"repo": {"$eq": repo}},
            {"pr_number": {"$eq": pr_number}},
        ]
    }

    # Remove stale chunks for this exact PR.
    collection.delete(where=metadata_filter)

    ids = []
    documents = []
    embeddings = []
    metadatas = []

    for index, file in enumerate(files):
        patch = file.get("patch") or ""

        # GitHub may omit patches for binary or very large files.
        if not patch.strip():
            continue

        ids.append(f"{owner}_{repo}_{pr_number}_{index}")
        documents.append(patch)
        embeddings.append(create_embedding(patch))
        metadatas.append({
            "owner": owner,
            "repo": repo,
            "pr_number": pr_number,
            "filename": file["filename"],
            "status": file["status"],
        })

    if ids:
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    return {
        "success": True,
        "owner": owner,
        "repo": repo,
        "pr_number": pr_number,
        "files_received": len(files),
        "patches_indexed": len(ids),
        "message": "Pull request indexed successfully.",
    }


def search_pull_request(
    query: str,
    owner: str,
    repo: str,
    pr_number: int,
    n_results: int = 5,
):
    if not query.strip():
        return []

    metadata_filter = {
        "$and": [
            {"owner": {"$eq": owner}},
            {"repo": {"$eq": repo}},
            {"pr_number": {"$eq": pr_number}},
        ]
    }

    # Count only the selected PR's indexed patches.
    matching = collection.get(
        where=metadata_filter,
        include=["metadatas"],
    )

    matching_count = len(matching.get("ids", []))

    if matching_count == 0:
        return []

    embedding = create_embedding(query)

    results = collection.query(
        query_embeddings=[embedding],
        n_results=min(n_results, matching_count),
        where=metadata_filter,
        include=["documents", "metadatas", "distances"],
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    return [
        {
            "owner": metadata["owner"],
            "repo": metadata["repo"],
            "pr_number": metadata["pr_number"],
            "filename": metadata["filename"],
            "status": metadata["status"],
            "patch": document,
            "distance": distance,
        }
        for document, metadata, distance in zip(
            documents, metadatas, distances
        )
    ]
