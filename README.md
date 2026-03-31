[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Tanish0023/smart-recruitment)

# Smart Recruitment System

A modern, AI-powered recruitment platform that streamlines hiring through automated resume parsing, semantic scoring, and intelligent candidate matching.

## 🚀 Features

- **Dual-Role System**: Separate workflows for applicants and recruiters with role-based authentication
- **AI-Powered Resume Processing**: Automatic parsing and skill extraction using NLP (spaCy)
- **Semantic Job Matching**: Intelligent scoring based on similarity between resumes and job descriptions
- **Real-time Notifications**: Email service for OTP verification and application status updates
- **Modern UI**: React frontend with TypeScript and Tailwind CSS
- **GraphQL API**: Efficient data querying with Apollo Client
- **Background Processing**: Celery workers for heavy tasks like resume parsing and scoring
- **Docker Support**: Containerized development environment

## 🏗️ Architecture

### High Level Diagram

<img width="3010" height="1462" alt="image" src="https://github.com/user-attachments/assets/1ef39bb9-928e-4f6b-a922-e61dc3fb2961" />

### System Overview

The system follows a decoupled architecture with clear separation between frontend, backend, and async processing layers:

```mermaid
graph TD
    subgraph "Frontend (React + Apollo)"
        UI["React Components"]
        AuthCtx["AuthProvider / AuthContext"]
        Apollo["Apollo Client (GraphQL)"]
    end

    subgraph "Backend (Django + Graphene)"
        GQL_View["GraphQLView (core/urls.py)"]
        UserApp["users app (Models/Schema)"]
        JobApp["jobs app (Models/Schema)"]
        ResumeApp["resumes app (NLP/Parsing)"]
    end

    subgraph "Async Processing"
        Redis["Redis (Message Broker)"]
        Celery["Celery Workers (core/celery.py)"]
    end

    UI --> AuthCtx
    UI --> Apollo
    Apollo -- "Mutations/Queries" --> GQL_View
    GQL_View --> UserApp
    GQL_View --> JobApp
    JobApp -- "Triggers Scoring" --> Redis
    ResumeApp -- "Triggers Parsing" --> Redis
    Redis --> Celery
    Celery -- "Updates Status" --> ResumeApp
```

### Database Schema

```mermaid
erDiagram
    Company ||--o{ User : "employs"
    User ||--o{ Job : "creates"
    User ||--o{ JobApplication : "submits"
    Job ||--o{ JobApplication : "receives"
    Job }o--o{ Skill : "requires"
    Category ||--o{ Job : "contains"
    User ||--o{ Resume : "uploads"
    Resume ||--o{ JobApplication : "used in"
    Skill }o--o{ Category : "categorized by"

    Company {
        int id PK
        string name
        string email
        string website
        boolean is_verified
        string otp_code
        datetime otp_expires_at
        datetime created_at
    }

    User {
        int id PK
        string username
        string email
        string first_name
        string last_name
        boolean is_recruiter
        int company_id FK
        string phone
        string location
        boolean is_verified
        string otp_code
        datetime otp_expires_at
        datetime onboarding_completed_at
        int primary_resume_id FK
    }

    Job {
        int id PK
        string title
        text description
        int company_id FK
        int created_by_id FK
        boolean is_active
        string location
        string salary_range
        int minimum_experience_required
        datetime created_at
        datetime updated_at
    }

    JobApplication {
        int id PK
        int job_id FK
        int applicant_id FK
        int resume_id FK
        float score
        string status
        datetime applied_at
        datetime updated_at
    }

    Resume {
        int id PK
        string file
        text parsed_text
        json parsed_data
        string status
        datetime uploaded_at
        datetime updated_at
    }

    Skill {
        int id PK
        string name
        int category_id FK
        json aliases
    }

    Category {
        int id PK
        string name
        text description
    }
```

### Core Components

#### User Management (`users` app)

- **User Model**: Extends `AbstractUser` with role flags and profile completion logic [1](#1-0)
- **Company Model**: Organization entity with OTP verification [2](#1-1)
- **Authentication**: JWT-based with OTP verification for both users and companies

#### Job Management (`jobs` app)

- **Job Model**: Postings with skills, categories, and experience requirements [3](#1-2)
- **JobApplication Model**: Junction model storing match scores and application status [4](#1-3)
- **Skills & Categories**: Hierarchical tagging system for better matching

#### Resume Processing (`resumes` app)

- **Resume Model**: Tracks file processing status (PENDING, PROCESSING, DONE, FAILED) [5](#1-4)
- **NLP Pipeline**: Uses spaCy for text extraction and skill identification
- **Scoring Algorithm**: Semantic similarity calculation using sentence-transformers

## 🛠️ Technology Stack

| Layer          | Technologies                                      | Key Components                                        |
| -------------- | ------------------------------------------------- | ----------------------------------------------------- |
| **Frontend**   | React, TypeScript, Tailwind CSS, Apollo Client    | `AuthProvider`, `RequireAuth`, `apollo-upload-client` |
| **Backend**    | Django, Graphene (GraphQL), Django REST Framework | `core.settings`, `GraphQLView`, `JWT`                 |
| **Database**   | PostgreSQL, Redis (Broker/Cache)                  | `psycopg2-binary`, `django-redis`                     |
| **Task Queue** | Celery, Flower (Monitoring)                       | `celery_worker`, `celery_email`, `resume_parsing`     |
| **NLP/AI**     | Spacy, Sentence-Transformers, PyPDF2              | `resume_parsing` task, `scoring_resume` task          |

## 📁 Project Structure

```
smart-recruitment/
├── backend/              # Django application
│   ├── core/            # Core Django settings and URLs
│   ├── users/           # User authentication and profiles
│   ├── jobs/            # Job postings and applications
│   ├── resumes/         # Resume processing and NLP
│   ├── email_service/   # Email notifications
│   └── requirements.txt
├── frontend/            # React application
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   ├── components/  # Reusable UI components
│   │   └── graphql/     # GraphQL queries/mutations
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── .github/workflows/   # CI/CD pipelines
```

## 🔄 How It Works

### Application Flow

1. **Job Posting**: Recruiters create jobs with specific skills and requirements
2. **Candidate Application**: Applicants submit resumes or apply to jobs
3. **AI Processing**: System automatically parses resumes and extracts skills
4. **Scoring**: Calculates semantic similarity between resume and job description
5. **Ranking**: Presents recruiters with a ranked list of candidates
6. **Communication**: Sends automated email notifications for status updates

### Detailed Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant E as Email Service
    participant D as Database

    U->>F: Register (email, password)
    F->>B: GraphQL Register Mutation
    B->>D: Create User (is_verified=false)
    B->>B: Generate OTP (6-digit, 10min expiry)
    B->>E: Send OTP Email
    E-->>U: OTP Verification Email

    U->>F: Submit OTP
    F->>B: GraphQL Verify OTP Mutation
    B->>B: Validate OTP & Expiry
    B->>D: Update User (is_verified=true)
    B->>F: Return JWT Token
    F->>F: Store Token in AuthContext

    Note over U,D: User now authenticated for 7 days
```

### Resume Processing Pipeline

```mermaid
sequenceDiagram
    participant A as Applicant (Frontend)
    participant B as Django Backend (jobs/resumes)
    participant R as Redis Broker
    participant C as Celery Worker (NLP)
    participant D as Database
    participant M as ML Models

    A->>B: Upload Resume PDF (GraphQL Mutation)
    B->>D: Create Resume (status=PENDING)
    B->>R: Dispatch 'resume_parsing' task
    R->>C: Execute NLP Processing

    C->>C: Extract text from PDF
    C->>C: Clean and normalize text
    C->>C: Extract sections (experience, education, skills)
    C->>C: Identify skills using spaCy NER
    C->>M: Generate text embeddings
    C->>D: Update Resume (status=DONE, parsed_data)

    Note over C,D: If parsing fails
    C->>D: Update Resume (status=FAILED)

    B-->>A: Resume processing complete
```

### Job Application & Scoring Flow

```mermaid
sequenceDiagram
    participant A as Applicant
    participant F as Frontend
    participant B as Backend
    participant R as Redis
    participant C as Celery
    participant RC as Recruiter

    A->>F: Apply to Job
    F->>B: applyToJob Mutation
    B->>B: Validate profile completion
    B->>B: Create JobApplication (status=reviewing)
    B->>R: Queue scoring_resume task
    R->>C: Process semantic scoring

    C->>C: Calculate skill match (50% weight)
    C->>C: Calculate category match (20% weight)
    C->>C: Calculate experience match (15% weight)
    C->>C: Calculate semantic similarity (15% weight)
    C->>C: Apply gating logic (skill_score < 0.3)
    C->>B: Update application score (0.0-1.0)

    RC->>F: View job applicants
    F->>B: jobApplicants Query (sort_by=RANKING)
    B->>B: Order by score DESC, applied_at DESC
    B-->>F: Ranked applicant list
    F-->>RC: Display ranked candidates
```

### Frontend Component Architecture

```mermaid
graph TD
    subgraph "React App Structure"
        App["App.tsx"]
        Router["BrowserRouter"]

        subgraph "Authentication"
            AuthProv["AuthProvider"]
            RequireAuth["RequireAuth HOC"]
        end

        subgraph "Pages"
            Login["LoginPage"]
            Register["RegisterPage"]
            ApplicantDash["ApplicantDashboard"]
            RecruiterDash["RecruiterDashboard"]
            JobDetail["JobDetailPage"]
            CompanyDash["CompanyDashboard"]
        end

        subgraph "Components"
            NavBar["NavigationBar"]
            JobCard["JobCard"]
            ApplicantCard["ApplicantCard"]
            ResumeUpload["ResumeUpload"]
        end

        subgraph "GraphQL Layer"
            Apollo["ApolloProvider"]
            Queries["GraphQL Queries"]
            Mutations["GraphQL Mutations"]
        end
    end

    App --> Router
    Router --> AuthProv
    AuthProv --> RequireAuth
    RequireAuth --> Login
    RequireAuth --> Register
    RequireAuth --> ApplicantDash
    RequireAuth --> RecruiterDash
    RequireAuth --> JobDetail
    RequireAuth --> CompanyDash

    ApplicantDash --> JobCard
    RecruiterDash --> ApplicantCard
    ApplicantDash --> ResumeUpload

    AuthProv --> Apollo
    Apollo --> Queries
    Apollo --> Mutations
```

## 🚀 Quick Start

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

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Configuration

### Backend Environment Variables

Create `.env` in backend:

```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgres:postgres@db:5432/recruitment_db
REDIS_URL=redis://redis:6379/0
MAILTRAP_API_TOKEN=your-mailtrap-token
DEFAULT_FROM_EMAIL=noreply@yourcompany.com
GOOGLE_OAUTH_CLIENT_IDS=your-google-web-client-id.apps.googleusercontent.com
```

### Frontend Environment Variables

Create `.env.local` in frontend:

```
VITE_GRAPHQL_URL=http://localhost:8000/graphql/
VITE_API_URL=http://localhost:8000/api/
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

## 🔑 Key Features Implementation

### Profile Completion Algorithm

Calculated as: 40% (Basic Info) + 40% (Skills) + 20% (Resume) [6](#1-5)

```python
def profile_completion_percent(self):
    status = self.profile_sections_status()
    weight = {
        "basicInfo": 40,    # Name, phone, location
        "skills": 40,       # At least one skill
        "resume": 20,       # Uploaded and parsed resume
    }
    return sum(points for section, points in weight.items() if status.get(section))
```

### Email Service Architecture

Uses Mailtrap API with SMTP fallback for transactional emails [7](#1-6)

```mermaid
graph LR
    A["Email Trigger"] --> B{"Mailtrap API Available?"}
    B -->|Yes| C["Mailtrap API"]
    B -->|No| D{"SMTP Configured?"}
    D -->|Yes| E["SMTP Server"]
    D -->|No| F["Error Log"]
    C --> G["Email Sent"]
    E --> G
```

### Resume Scoring Algorithm

Applications are scored between 0.0 and 1.0 based on multiple factors [8](#1-7)

```python
def calculate_final_score(skill, category, experience, semantic):
    return (
        0.5 * skill +        # MOST IMPORTANT - skill matching
        0.2 * category +     # category alignment
        0.15 * experience +  # experience requirements
        0.15 * semantic      # cosine similarity
    )
```

### GraphQL API Schema

#### Authentication Mutations

```graphql
mutation {
  register(username: String!, email: String!, password: String!)
  verifyUserOtp(otp: String!)
  applicantLogin(username: String!, password: String!)
  companyLogin(username: String!, password: String!)
    googleApplicantAuth(idToken: String!)
    googleCompanyAuth(idToken: String!, companyName: String, companyWebsite: String)
}
```

#### Job Management

```graphql
query {
  allJobs {
    id, title, description, company, location, salaryRange
  }
  jobDetail(jobId: Int!) {
    id, title, description, skills, categories
  }
}

mutation {
  createJob(title: String!, description: String!, skills: [Int!])
  applyToJob(jobId: Int!)
  updateApplicationStatus(applicationId: Int!, status: String!)
}
```

## 🧪 Development Guidelines

### Code Quality

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

## 📊 Monitoring & Performance

### System Monitoring

- **Flower**: Celery task monitoring at http://localhost:5555
- **GraphQL Playground**: Interactive API testing at http://localhost:8000/graphql/
- **Database**: PostgreSQL with connection pooling
- **Redis**: Message broker and caching layer

### Performance Metrics

```mermaid
graph TD
    A["Request In"] --> B["Response Time < 200ms"]
    A --> C["Resume Processing < 30s"]
    A --> D["Scoring < 5s per application"]

    B --> E["Frontend: React + Apollo Cache"]
    C --> F["Backend: Celery + spaCy NLP"]
    D --> G["ML: Sentence Transformers"]

    E --> H["Optimized GraphQL Queries"]
    F --> I["Async Task Queue"]
    G --> J["Pre-trained Models"]
```

## 🔐 Security Features

- **OTP Verification**: Two-factor authentication for email verification
- **JWT Authentication**: Secure token-based authentication with 7-day expiration<cite repo="Tan
