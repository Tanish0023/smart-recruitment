# ---------- BUILDER STAGE ----------
FROM python:3.11-slim AS builder

WORKDIR /app

# install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# copy requirements first for caching
COPY requirements.txt .

# upgrade pip
RUN pip install --upgrade pip

# install dependencies into temp location
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

# download spacy model during build
RUN pip install --prefix=/install --no-cache-dir \
    https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl

# ---------- FINAL STAGE ----------
FROM python:3.11-slim

WORKDIR /app

# install runtime dependencies only
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# copy installed packages from builder
COPY --from=builder /install /usr/local

# copy application
COPY . .

# create non-root user
RUN useradd -m -u 1000 appuser \
    && chown -R appuser:appuser /app

USER appuser

CMD ["sh", "entrypoint.sh"]