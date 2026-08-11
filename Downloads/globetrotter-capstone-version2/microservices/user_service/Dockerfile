FROM python:3.11-slim

WORKDIR /service

COPY user_service/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared package and app code (build context is the microservices root)
# The shared package files (__init__.py, jwt_utils.py) live directly in the
# shared/ dir, so we copy them into the service as a proper `shared` package
# beside the app. This makes `import shared` resolve via PYTHONPATH=/service.
COPY shared ./shared
ENV PYTHONPATH=/service

COPY user_service/app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
