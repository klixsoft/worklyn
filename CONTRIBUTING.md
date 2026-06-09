# Contributing to Worklyn

Thank you for your interest in contributing to Worklyn! 🎉

We welcome all contributions — bug fixes, new features, documentation improvements, and more. Please take a moment to review this guide before submitting anything.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/worklyn.git
   cd worklyn
   ```
3. **Add the upstream remote:**
   ```bash
   git remote add upstream https://github.com/klixsoft/worklyn.git
   ```
4. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## How to Contribute

### 🐛 Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) when opening an issue. Please include:
- A clear, descriptive title
- Steps to reproduce
- Expected vs. actual behaviour
- Screenshots or logs if applicable
- Environment details (OS, browser, Docker version)

### 💡 Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md). Please explain:
- The problem you're solving
- Your proposed solution
- Any alternative approaches you've considered

### 🔧 Submitting Code

- Keep PRs **focused** — one feature or fix per PR
- Write **clear commit messages** following our convention below
- Add **tests** where applicable
- Update **documentation** if your change affects it
- Ensure all **CI checks pass** before requesting review

---

## Development Setup

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev        # Starts dev server at http://localhost:3000
npm run lint       # Lint check
npx tsc --noEmit  # Type check
```

### Backend (FastAPI)

```bash
cd backend
uv sync                                        # Install deps
uv run uvicorn main:app --reload               # Dev server at http://localhost:8000
```

### Full Stack (Docker)

```bash
docker-compose up --build
```

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, no logic change) |
| `refactor` | Refactoring (no feature/bug change) |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, dependency updates |
| `perf` | Performance improvement |

### Examples

```
feat(dashboard): add ApexCharts analytics row
fix(sidebar): hide People & Access in project view
docs(readme): update quick start instructions
chore(deps): bump next to 16.2.7
```

---

## Pull Request Process

1. **Update your branch** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Ensure your branch **builds without errors**
3. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely
4. Request review from at least **one maintainer**
5. Address all review comments before merging
6. Squash commits if requested

---

## Coding Standards

### Frontend (TypeScript / React)

- Use **TypeScript** — no `any` types without justification
- Prefer **functional components** with hooks
- Use **shadcn/ui** components — avoid raw HTML elements for UI
- Follow the existing **Tailwind class ordering**
- Labels: **12px, no bold** (`text-xs font-normal`)
- All nav items must use the **unified sidebar nav item style**

### Backend (Python)

- Follow **PEP 8**
- Use **type annotations** for all function signatures
- Keep routes in dedicated router files as the API grows
- Use `uv` for all dependency management — never `pip install` directly

### General

- No **console.log** or **print** statements in committed code
- Every new page/route needs a `<title>` and meta description
- Use **semantic HTML** elements

---

## Questions?

Feel free to open a [Discussion](https://github.com/klixsoft/worklyn/discussions) or reach out to the maintainers. We're happy to help!
