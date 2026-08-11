FROM python:3.11-slim

WORKDIR /service

COPY gateway/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY gateway/app ./app

ENV PYTHONPATH=/service

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
