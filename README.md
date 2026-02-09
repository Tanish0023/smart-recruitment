# Smart Recruitment System

A modern recruitment platform built with Django, React, GraphQL, and Celery.

## 🚀 Features

- **Django Backend** - Python REST API with GraphQL
- **React Frontend** - Modern TypeScript + Tailwind CSS UI
- **GraphQL** - Efficient data querying with Apollo Client
- **Celery** - Background task processing with Flower monitoring
- **PostgreSQL** - Robust database
- **Redis** - Caching and message broker
- **Docker** - Containerized development environment
- **Automated Testing** - GitHub Actions CI/CD pipeline

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

## 🛠️ Quick Start

### Using Docker (Recommended)

```bash
# Start all services
docker compose up --build

# Services will be available at:
# - Django Backend: http://localhost:8000
# - GraphQL: http://localhost:8000/graphql/
# - Flower (Celery): http://localhost:5555
# - PostgreSQL: localhost:6400
# - Redis: localhost:3400
```

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
smart-recruitment/
├── backend/              # Django application
│   ├── core/            # Core Django settings
│   ├── users/           # User module
│   ├── jobs/            # Jobs module
│   ├── resumes/         # Resumes module
│   └── requirements.txt
├── frontend/            # React application
│   ├── src/
│   ├── public/
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── .github/workflows/   # CI/CD pipelines
```

## 🔧 Configuration

### Backend Environment Variables
Create `.env` in backend:
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:postgres@db:5432/recruitment_db
REDIS_URL=redis://redis:6379/0
```

### Frontend Environment Variables
Create `.env.local` in frontend:
```
VITE_GRAPHQL_URL=http://localhost:8000/graphql/
VITE_API_URL=http://localhost:8000/api/
```

## ✅ Code Quality

### Linting
```bash
# Backend: Flake8
cd backend
flake8 .

# Frontend: ESLint
cd frontend
npm run lint
```

### Testing
```bash
# Backend
cd backend
python manage.py test

# Frontend
cd frontend
npm run build
```

## 🔄 CI/CD Pipeline

GitHub Actions automatically runs on every push and pull request:
- ✅ Backend linting (Flake8)
- ✅ Backend tests
- ✅ Frontend linting (ESLint)
- ✅ Frontend build
- ✅ Security checks (Bandit, Safety)

See [.github/GITHUB_ACTIONS_SETUP.md](.github/GITHUB_ACTIONS_SETUP.md) for setup instructions.

## 📊 Monitoring

- **Flower Dashboard**: `http://localhost:5555` - Monitor Celery tasks
- **Django Admin**: `http://localhost:8000/admin/` - Manage data
- **GraphQL Explorer**: `http://localhost:8000/graphql/` - Query data

## 🐳 Docker Services

| Service | Port | Container |
|---------|------|-----------|
| Django Backend | 8000 | django_backend |
| PostgreSQL | 6400 | postgres_db |
| Redis | 3400 | redis |
| Celery Worker | - | celery_worker |
| Flower | 5555 | flower |

## 📝 License

MIT

## 👤 Author

Your Name