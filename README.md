# FlexPulse Workout Tracker

![Workout Tracker Demo](./workout.gif)

FlexPulse is a full-stack strength and workout tracking web application built with React, TypeScript, Tailwind CSS, and a Django REST Framework backend with JWT authentication.

## Key Features

- **Authenticated Training Logs:** Sign in with JWT-backed accounts so workout logs, personal records, and body metrics persist safely per user.
- **Live Workout Execution:** Log weights, reps, and RPE with automatic Personal Record detection (Epley 1RM estimation) and a built-in rest timer.
- **Structured Programs & Routine Builder:** Run seeded training programs (Push Pull Legs, Arnold Split, Classic Bro Split, Stronglifts 5x5, Upper/Lower, Full Body) or build custom multi-day splits.
- **Exercise Library:** Categorized exercises by muscle group, equipment, and movement category, complete with execution steps, form cues, and common mistakes.
- **Training Command Dashboard:** Real-time session counts, 7-day volume aggregation from logged workouts, Squat/Bench/Deadlift PR tracking, and reference guides.
- **Unit Toggle & Dark Mode:** Switch seamlessly between LBS and KG and between light and dark themes.
- **Legal & Compliance:** Built-in Terms & Conditions (`/terms`) and Privacy Policy (`/privacy`) pages accessible before and after sign-in.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Lucide React
- **Backend:** Django 6, Django REST Framework, SimpleJWT, Django CORS Headers
- **Database:** SQLite with WAL mode and foreign key constraints enabled

## Security Configuration

- Environment-driven secrets (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False` by default, `DJANGO_ALLOWED_HOSTS`, `DJANGO_ADMIN_URL`).
- Explicit CORS and CSRF origin allowlists (`CORS_ALLOW_ALL_ORIGINS = False`).
- Rate limiting on authentication (`auth_login`, `auth_register`), API endpoints, and Django admin login routes.
- Defensive HTTP security headers (`Content-Security-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`).
- Strict input sanitization and payload validation across frontend forms and backend serializers.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+

### Environment Setup

Copy `.env.example` to `backend/.env` and set a strong `DJANGO_SECRET_KEY` along with allowed hosts and origins.

### Backend Setup

```bash
cd backend
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python seed.py
python manage.py runserver
```

### Frontend Development

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000`.

### Production Build

```bash
npm run build
```

This generates an optimized production bundle (without source maps) in `dist/`, which Django serves directly.

## CI/CD Pipeline & Deployment

- **GitHub Actions (`.github/workflows/ci-cd.yml`)**: Automatically runs on every push and pull request to `main` and `SHINIGAMI`:
  1. `frontend-ci`: Installs packages cleanly, runs `npm audit --audit-level=high`, TypeScript typechecking (`npm run lint`), Vite production build (`npm run build`), and verifies `dist/` artifacts with zero source maps.
  2. `backend-ci`: Runs codebase security/hygiene checks, `manage.py check`, `makemigrations --check`, `migrate`, `seed.py`, and the automated API/security test suite (`manage.py test api`).
  3. `docker-and-deploy`: Builds and verifies the multi-stage production Docker image (`Dockerfile`), packages a clean release bundle, and triggers `DEPLOY_WEBHOOK_URL` when configured.
- **Container & Blueprint Deployment**: Includes a multi-stage `Dockerfile` and `render.yaml` Blueprint for zero-config cloud deployment.

## License

This project is licensed under the MIT License.
