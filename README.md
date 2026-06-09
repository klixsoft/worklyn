<div align="center">

<img src="https://klixsoft.com/images/logo.svg" alt="Worklyn Logo" width="72" height="72" />

# Worklyn

**Open-source project management platform built for modern engineering teams.**

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](docker-compose.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Demo](#) · [Documentation](#) · [Report a Bug](https://github.com/klixsoft/worklyn/issues/new?template=bug_report.md) · [Request a Feature](https://github.com/klixsoft/worklyn/issues/new?template=feature_request.md)

</div>

---

## ✨ Overview

Worklyn is a self-hostable, multi-module workspace platform that brings project management, team communication, attendance tracking, and role-based access control into one cohesive interface — powered by a **Next.js** frontend and a **FastAPI** backend.

### Key Features

| Feature | Description |
|---|---|
| 🗂 **Kanban Boards** | Drag-and-drop project boards with custom columns and task assignment |
| 💬 **Team Chat** | Real-time channels, group chats, and direct messages per project |
| 📊 **Analytics Dashboard** | Live charts — task distribution, project velocity, team workload |
| 🕐 **Attendance Tracking** | Clock-in / clock-out with daily standup logs |
| 👥 **User & Role Management** | Dynamic roles with granular per-module permission control |
| 🧩 **Multi-Software Switcher** | Switch between PM, Finance, and HR modules from the sidebar |
| 🌗 **Dark / Light Mode** | System-aware theming with instant toggle |

---

## 🛠 Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org)** — App Router, Server Components, standalone output
- **[shadcn/ui](https://ui.shadcn.com)** — Accessible, unstyled component primitives
- **[Tailwind CSS v4](https://tailwindcss.com)** — Utility-first styling
- **[ApexCharts](https://apexcharts.com)** — Interactive analytics charts
- **[TanStack Query](https://tanstack.com/query)** — Server state management

### Backend
- **[FastAPI](https://fastapi.tiangolo.com)** — High-performance async API framework
- **[uvicorn](https://www.uvicorn.org)** — Lightning-fast ASGI server
- **[uv](https://docs.astral.sh/uv)** — Ultra-fast Python package manager

### Infrastructure
- **Docker** + **Docker Compose** — Containerised, one-command deployment

---

## 🚀 Quick Start

### Prerequisites
- [Docker](https://www.docker.com/get-started) ≥ 24
- [Docker Compose](https://docs.docker.com/compose) ≥ 2.x

### Run with Docker

```bash
# Clone the repository
git clone https://github.com/klixsoft/worklyn.git
cd worklyn

# Start all services
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| Backend (FastAPI) | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

### Local Development

#### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

#### Backend

```bash
cd backend
uv sync            # install dependencies
uv run uvicorn main:app --reload   # http://localhost:8000
```

---

## 📁 Project Structure

```
worklyn/
├── frontend/                 # Next.js application
│   ├── app/                  # App Router pages & layouts
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── sidebar.tsx       # Navigation sidebar
│   │   └── dashboard.tsx     # Analytics dashboard
│   └── Dockerfile
│
├── backend/                  # FastAPI application
│   ├── main.py               # App entry point & routes
│   ├── pyproject.toml        # Python dependencies
│   └── Dockerfile
│
├── docker/                   # Docker entrypoint scripts
│   ├── frontend/entrypoint.sh
│   └── backend/entrypoint.sh
│
├── docker-compose.yml        # Compose orchestration
├── LICENSE                   # MIT License
└── README.md
```

---

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🔒 Security

If you discover a security vulnerability, please read our [Security Policy](SECURITY.md) before disclosing it publicly.

---

## 📄 License

Worklyn is open-source software licensed under the **[MIT License](LICENSE)**.

---

<div align="center">

Made with ❤️ by [Klixsoft](https://klixsoft.com) and the open-source community.

</div>
