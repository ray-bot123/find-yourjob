FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN python3 -m venv /opt/fyj && /opt/fyj/bin/pip install --no-cache-dir -r requirements.txt
COPY server.mjs run.mjs member-proxy.mjs paypal.mjs adzuna.mjs ai_service.py resume_service.py study_service.py ./
COPY dist ./dist
ENV PYTHON=/opt/fyj/bin/python FYJ_BIND_HOST=0.0.0.0
EXPOSE 4175
CMD ["node","run.mjs"]
