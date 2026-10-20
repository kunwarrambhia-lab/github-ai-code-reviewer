# GitHub AI Code Reviewer

An AI-powered GitHub Pull Request review assistant built with **FastAPI, Groq, ChromaDB, and Next.js**. It helps developers understand code changes, explore potential issues, and obtain AI-generated code review feedback through an interactive dashboard.

## Overview

GitHub AI Code Reviewer combines GitHub API integration, large language models, semantic search, and vector storage to assist with Pull Request analysis.

Developers can retrieve Pull Request information, index code changes, generate AI-powered reviews, ask contextual questions, and export review reports in Markdown format.

## Features

- **Pull Request Analysis:** Retrieve Pull Request details and changed files from GitHub.
- **AI-Powered Code Review:** Generate review summaries, potential risks, and improvement suggestions.
- **Semantic Search:** Search indexed Pull Request patches using ChromaDB.
- **AI Pull Request Assistant:** Ask natural-language questions about indexed code changes.
- **Interactive Dashboard:** Explore Pull Request information and review results through a web interface.
- **Markdown Report Export:** Save review feedback for future reference.
- **REST API:** Access backend functionality through FastAPI endpoints.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Language Model API | Groq |
| Vector Database | ChromaDB |
| Embeddings | Project embedding service |
| Version Control Integration | GitHub API |
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

## Prerequisites

- Python and pip, compatible with the project's dependencies
- Node.js and npm
- A GitHub Personal Access Token with appropriate repository permissions
- A Groq API key

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kunwarrambhia-lab/github-ai-code-reviewer.git
cd github-ai-code-reviewer
```

### 2. Configure the Backend

Create a Python virtual environment from the project root.

**Windows PowerShell**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the project root, using `.env.example` as a reference.

```env
GITHUB_TOKEN=your_github_token_here
GROQ_API_KEY=your_groq_api_key_here
```

Replace the placeholders with your own credentials. Never commit your actual `.env` file or expose API keys publicly.

### 4. Start the Backend

From the project root, run:

```powershell
python -m uvicorn backend.app:app --reload
```

The backend should be available at:

- **API:** http://127.0.0.1:8000
- **Interactive API documentation:** http://127.0.0.1:8000/docs

### 5. Configure and Start the Frontend

Open a second terminal and run:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed in the terminal. It is commonly `http://localhost:3000`, although another port may be selected if that port is occupied.

Keep the backend running while using the frontend. Configure the frontend API URL if your local setup requires a different backend address.

## How to Use

1. Start the backend and frontend.
2. Open the dashboard in your browser.
3. Enter the GitHub repository owner, repository name, and Pull Request number.
4. Retrieve the Pull Request details and changed files.
5. Index the Pull Request when semantic search or contextual retrieval is needed.
6. Generate an AI-powered code review.
7. Explore the feedback and ask follow-up questions.
8. Export the review as a Markdown report.

The available functionality depends on the Pull Request context, configured API credentials, and the implementation of each feature.

## API Endpoints

The following endpoints describe the intended API interface; verify them against the current backend implementation.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/health` | Backend health check |
| GET | `/prs/{owner}/{repo}` | Retrieve Pull Requests |
| GET | `/pr/{owner}/{repo}/{pr_number}` | Retrieve Pull Request details |
| GET | `/files/{owner}/{repo}/{pr_number}` | Retrieve changed files |
| POST | `/index/{owner}/{repo}/{pr_number}` | Index Pull Request content |
| GET | `/search` | Search indexed code patches |
| GET | `/review` | Generate a code review |
| GET | `/analyze` | Retrieve structured analysis |
| GET | `/chat` | Ask questions about Pull Request content |

For the exact routes, parameters, and request formats, start the backend and open the interactive API documentation at `http://127.0.0.1:8000/docs`.

## Security and Limitations

- Store API credentials in environment variables and keep `.env` out of version control.
- Do not commit API keys, access tokens, private source code, or local database files.
- AI-generated feedback can contain false positives or miss defects.
- Review suggestions against the actual source code and run appropriate tests before applying changes.
- Review quality depends on the available Pull Request context, retrieved code, and language model output.
- This tool assists developers; it does not replace human review or a dedicated security audit.

## Future Improvements

- Improve structured finding extraction and categorization.
- Expand automated testing and error handling.
- Add review history and Pull Request comparisons.
- Improve report formatting and export options.
- Explore automated review workflows and continuous integration.

## Disclaimer

This project is intended for developer assistance and educational use. AI-generated findings are suggestions and should be independently verified before implementation.

## Author

**Kunwar Amit Rambhia**

GitHub: [kunwarrambhia-lab](https://github.com/kunwarrambhia-lab)

Project repository: [GitHub AI Code Reviewer](https://github.com/kunwarrambhia-lab/github-ai-code-reviewer)
