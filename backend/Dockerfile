FROM python:3.10-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.10-slim AS runner

WORKDIR /app

COPY --from=builder /root/.local /root/.local
COPY . /app

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
EXPOSE 8008

RUN useradd -u 8888 appuser && chown -R appuser:appuser /app
USER appuser

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8008"]
