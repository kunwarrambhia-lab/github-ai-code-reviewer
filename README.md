# GitHub AI Code Reviewer

An AI-powered tool for reviewing GitHub Pull Requests using **FastAPI, Groq, ChromaDB, and Next.js**.

## Overview

GitHub AI Code Reviewer analyzes pull request changes and provides AI-generated feedback to help developers understand code modifications, identify potential risks, and improve code quality.

The project combines GitHub API integration, semantic search, vector storage, and large language models in an interactive web dashboard.

## Features

- **Pull Request Analysis:** Fetch and review GitHub pull requests.
- **AI Code Review:** Generate detailed reviews with summaries, potential risks, security considerations, and performance suggestions.
- **Semantic Search:** Retrieve relevant code patches using ChromaDB.
- **AI Pull Request Assistant:** Ask questions about a selected pull request using natural language.
- **Interactive Dashboard:** View pull request details, changed files, and review results.
- **Report Export:** Download code review reports in Markdown format.
- **REST API:** Use FastAPI endpoints to access review and analysis functionality.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| AI Model | Groq API |
| Vector Database | ChromaDB |
| Code Embeddings | Project embedding service |
| Integration | GitHub API |
| HTTP Client | Axios |

## Project Structure

```text
github-ai-code-reviewer/
├── backend/
│   ├── services/
│   │   ├── analyzer.py
│   │   ├── chat_engine.py
│   │   ├── embeddings.py
│   │   ├── github_api.py
│   │   ├── review_engine.py
│   │   └── vector_db.py
│   └── app.py
├── frontend/
├── tests/
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

*The structure above is illustrative; update it if your actual files differ.*

## Prerequisites

- Python 3.10 or a compatible version for the installed dependencies
- Node.js and npm
- A GitHub personal access token with the required repository access
- A Groq API key

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/github-ai-code-reviewer.git
cd github-ai-code-reviewer
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Set up the backend

Create and activate a virtual environment on Windows:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```powershell
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root, using the following template:

```env
GITHUB_TOKEN=your_github_token
GROQ_API_KEY=your_groq_api_key
```

Replace the placeholders with your own credentials. Never commit your actual `.env` file or expose API keys.

### 4. Start the backend

Run this command from the project root:

```powershell
python -m uvicorn backend.app:app --reload
```

The backend should be available at:

`http://127.0.0.1:8000`

Interactive API documentation:

`http://127.0.0.1:8000/docs`

### 5. Set up the frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL displayed in the terminal, typically `http://localhost:3000`. If that port is busy, Next.js may use another port.

## How to Use

1. Start the backend and frontend.
2. Open the dashboard in your browser.
3. Enter a GitHub repository owner, repository name, and pull request number.
4. Fetch or select the pull request.
5. Generate an AI-powered code review.
6. Explore changed files and review recommendations.
7. Ask follow-up questions in the AI Pull Request Assistant.
8. Download the report for later reference.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/health` | Check backend status |
| GET | `/prs/{owner}/{repo}` | Fetch pull requests |
| GET | `/pr/{owner}/{repo}/{pr_number}` | Fetch pull request details |
| GET | `/files/{owner}/{repo}/{pr_number}` | Fetch changed files |
| POST | `/index/{owner}/{repo}/{pr_number}` | Index a pull request |
| GET | `/search` | Search indexed code patches |
| GET | `/review` | Generate a code review |
| GET | `/analyze` | Retrieve structured analysis |
| GET | `/chat` | Ask questions about a pull request |

## Security and Limitations

- Keep GitHub and Groq credentials in environment variables.
- Do not commit `.env`, virtual environments, API keys, or local database files.
- AI-generated reviews can contain false positives or miss defects. Verify suggestions against the actual source code.
- Results depend on the retrieved patches and the available pull request context.
- Structured findings may not capture every issue discussed in the narrative review.

## Future Improvements

- Improve structured finding extraction and categorization.
- Add more automated tests and error-handling coverage.
- Support richer review history and comparisons.
- Improve report formatting and export options.
- Explore automated review workflows for GitHub pull requests.

## Disclaimer

This project is intended as a developer-assistance tool. AI-generated findings are suggestions, not a substitute for human code review, testing, or security audits.

## Author

Kunwar Amit Rambhia

GitHub: https://github.com/kunwarrambhia-lab