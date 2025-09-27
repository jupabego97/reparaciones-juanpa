# Backend FastAPI - Tienda Tech

## Requisitos
- Python 3.10+
- pip

## Instalación
```bash
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
pip install -r backend/requirements.txt
```

## Ejecutar
```bash
uvicorn backend.app.main:app --reload --port 8000
```

API en: `http://localhost:8000`

## Endpoints
- GET `/health`
- GET/POST `/products`
- PUT/DELETE `/products/{product_id}`
- GET/PUT `/rates`
- GET/POST `/orders`

Los datos se guardan como JSON en `backend/app/data/`.
