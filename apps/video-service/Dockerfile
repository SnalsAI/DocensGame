# ===========================================
# EDU-ATELIER Video Service - Production Dockerfile
# ===========================================

# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Production
FROM python:3.11-slim AS runner

WORKDIR /app

# Install runtime dependencies (FFmpeg, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Add non-root user
RUN groupadd --system --gid 1001 python && \
    useradd --system --uid 1001 --gid python videoservice

# Copy virtual environment
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application code
COPY --chown=videoservice:python . .

# Create directories
RUN mkdir -p /models /tmp/videos /avatars && \
    chown -R videoservice:python /models /tmp/videos /avatars

USER videoservice

# Environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8002
ENV FFMPEG_PATH=/usr/bin/ffmpeg

EXPOSE 8002

# Volumes
VOLUME ["/models", "/tmp/videos", "/avatars"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8002/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--workers", "2"]
