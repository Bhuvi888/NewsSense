FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl -fsSL https://cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem \
       -o /etc/ssl/certs/DigiCertGlobalRootG2.crt.pem \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# The service uses CPU inference. Installing the CPU wheel first prevents pip
# from pulling the much larger CUDA runtime into the production image.
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch \
    && pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
