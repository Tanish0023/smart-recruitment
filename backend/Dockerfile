# ---------- BUILDER STAGE ----------
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


# ---------- FINAL STAGE ----------
FROM python:3.11-slim

WORKDIR /app

# only runtime deps (light)
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# copy installed packages from builder
COPY --from=builder /install /usr/local

COPY . .

# non-root user
RUN useradd -m -u 1000 appuser \
    && chown -R appuser:appuser /app

USER appuser

CMD ["sh", "entrypoint.sh"]
