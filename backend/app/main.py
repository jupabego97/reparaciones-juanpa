from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
PRODUCTS_FILE = DATA_DIR / "products.json"
ORDERS_FILE = DATA_DIR / "orders.json"
RATES_FILE = DATA_DIR / "rates.json"

# Modelos
class Product(BaseModel):
    id: str
    name: str
    description: str
    price: float  # USD base
    category: str
    image: str

class ProductIn(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image: str

class OrderItem(BaseModel):
    product_id: str
    qty: int

class Order(BaseModel):
    id: str
    name: str
    email: str
    address: str
    notes: Optional[str] = None
    currency: str = "USD"
    items: List[OrderItem]
    total_usd: float

class OrderIn(BaseModel):
    name: str
    email: str
    address: str
    notes: Optional[str] = None
    currency: str = "USD"
    items: List[OrderItem]

class Rate(BaseModel):
    USD: float
    EUR: float
    COP: float
    MXN: float

# Helpers de persistencia

def read_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def write_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# Semilla si no existen
if not PRODUCTS_FILE.exists():
    write_json(PRODUCTS_FILE, [
        {"id": "pc-01", "name": "Laptop Pro 14", "description": "Intel Core i7, 16GB RAM, 512GB SSD, 14\"", "price": 1299, "category": "computadores", "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop"},
        {"id": "pc-02", "name": "Laptop Ultralight 13", "description": "Intel Core i5, 8GB RAM, 256GB SSD, 13\"", "price": 899, "category": "computadores", "image": "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop"},
        {"id": "pc-03", "name": "Desktop Gamer RTX", "description": "Ryzen 7, 32GB RAM, RTX 4070, 1TB NVMe", "price": 1999, "category": "computadores", "image": "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=1200&auto=format&fit=crop"},
        {"id": "sp-01", "name": "Parlantes Stereo X2", "description": "Bluetooth 5.0, Sonido 360°, Batería 12h", "price": 149, "category": "parlantes", "image": "https://images.unsplash.com/photo-1518441902113-c1d3b5d0f803?q=80&w=1200&auto=format&fit=crop"},
        {"id": "sp-02", "name": "Barra de Sonido 2.1", "description": "Subwoofer inalámbrico, HDMI ARC, 200W", "price": 299, "category": "parlantes", "image": "https://images.unsplash.com/photo-1546900703-cf06143d1239?q=80&w=1200&auto=format&fit=crop"},
        {"id": "sp-03", "name": "Parlante Portátil IPX7", "description": "Resistente al agua, USB-C, 20W", "price": 99, "category": "parlantes", "image": "https://images.unsplash.com/photo-1585386959984-a4155223168f?q=80&w=1200&auto=format&fit=crop"}
    ])

if not ORDERS_FILE.exists():
    write_json(ORDERS_FILE, [])

if not RATES_FILE.exists():
    write_json(RATES_FILE, {"USD": 1.0, "EUR": 0.92, "COP": 4200, "MXN": 17})


app = FastAPI(title="Tienda Tech API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# Productos
@app.get("/products", response_model=List[Product])
def list_products():
    data = read_json(PRODUCTS_FILE, [])
    return data


@app.post("/products", response_model=Product)
def create_product(body: ProductIn):
    products = read_json(PRODUCTS_FILE, [])
    new_id = generate_id(products)
    prod = {"id": new_id, **body.model_dump()}
    products.insert(0, prod)
    write_json(PRODUCTS_FILE, products)
    return prod


@app.put("/products/{product_id}", response_model=Product)
def update_product(product_id: str, body: ProductIn):
    products = read_json(PRODUCTS_FILE, [])
    idx = next((i for i, p in enumerate(products) if p["id"] == product_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    products[idx] = {"id": product_id, **body.model_dump()}
    write_json(PRODUCTS_FILE, products)
    return products[idx]


@app.delete("/products/{product_id}")
def delete_product(product_id: str):
    products = read_json(PRODUCTS_FILE, [])
    new_list = [p for p in products if p["id"] != product_id]
    if len(new_list) == len(products):
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    write_json(PRODUCTS_FILE, new_list)
    return {"deleted": product_id}


# Tasas
@app.get("/rates", response_model=Rate)
def get_rates():
    return read_json(RATES_FILE, {"USD": 1.0, "EUR": 0.92, "COP": 4200, "MXN": 17})

@app.put("/rates", response_model=Rate)
def update_rates(body: Rate):
    write_json(RATES_FILE, body.model_dump())
    return body


# Pedidos
@app.get("/orders", response_model=List[Order])
def list_orders():
    return read_json(ORDERS_FILE, [])

@app.post("/orders", response_model=Order)
def create_order(body: OrderIn):
    products = {p["id"]: p for p in read_json(PRODUCTS_FILE, [])}
    total_usd = 0.0
    for item in body.items:
        if item.product_id not in products:
            raise HTTPException(status_code=400, detail=f"Producto inválido: {item.product_id}")
        if item.qty <= 0:
            raise HTTPException(status_code=400, detail=f"Cantidad inválida para {item.product_id}")
        total_usd += products[item.product_id]["price"] * item.qty
    order = Order(
        id=generate_id(read_json(ORDERS_FILE, [])),
        name=body.name,
        email=body.email,
        address=body.address,
        notes=body.notes,
        currency=body.currency,
        items=body.items,
        total_usd=round(total_usd, 2),
    )
    orders = read_json(ORDERS_FILE, [])
    orders.insert(0, order.model_dump())
    write_json(ORDERS_FILE, orders)
    return order


# Utils

def generate_id(existing: list) -> str:
    import random, string
    def rand():
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=7))
    ids = {item.get('id') for item in existing}
    new_id = rand()
    while new_id in ids:
        new_id = rand()
    return new_id
