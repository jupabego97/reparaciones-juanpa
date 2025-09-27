from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# URL de la base de datos - PostgreSQL de Railway
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:gqcHUVdSYGDmyKDXJyBYmpFRsCsACqPI@tramway.proxy.rlwy.net:16790/railway"
)

# Crear engine de SQLAlchemy con fallback a SQLite
try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False,  # Cambiar a True para debug SQL
        connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    )
    # Probar la conexión
    with engine.connect() as conn:
        conn.execute("SELECT 1")
    print("✅ Conectado exitosamente a la base de datos")
except Exception as e:
    print(f"❌ Error conectando a PostgreSQL: {e}")
    print("🔄 Cambiando a SQLite como fallback...")
    DATABASE_URL = "sqlite:///./repair_cards.db"
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False,
        connect_args={"check_same_thread": False}
    )
    print("✅ Usando SQLite como base de datos de desarrollo")

# Crear SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependency para obtener la sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Función para probar la conexión
def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            print("✅ Conexión a Railway PostgreSQL exitosa")
            return True
    except Exception as e:
        print(f"❌ Error conectando a Railway PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    test_connection()
