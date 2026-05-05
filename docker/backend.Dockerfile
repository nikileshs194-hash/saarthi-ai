FROM python:3.11
WORKDIR /app
COPY backend/requirements.txt /app/requirements.txt
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install -r requirements.txt
COPY backend/ /app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]