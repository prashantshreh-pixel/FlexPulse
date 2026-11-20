# Stage 1: Build React + Vite production bundle
FROM node:22-alpine AS frontend-builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY index.html tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

# Stage 2: Django + Gunicorn production runtime
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_DEBUG=False \
    PORT=8000

WORKDIR /app

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend
COPY seed.json ./seed.json
COPY --from=frontend-builder /app/dist ./dist

RUN rm -f ./backend/*.sqlite3 ./backend/.env && chown -R appuser:appgroup /app

USER appuser
EXPOSE 8000

CMD ["sh", "-c", "python backend/manage.py migrate --noinput && python backend/seed.py && gunicorn --chdir backend flexpulse_backend.wsgi:application --bind 0.0.0.0:${PORT} --workers 2 --threads 4 --timeout 60"]
