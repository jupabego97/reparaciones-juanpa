from dotenv import load_dotenv
load_dotenv()

import os
from sqlalchemy import create_engine, text

engine = create_engine(os.environ['DATABASE_URL'])
query_total = """
    SELECT COUNT(*)
    FROM repair_cards
"""

query_with_images = """
    SELECT COUNT(*)
    FROM repair_cards
    WHERE image_url IS NOT NULL AND image_url <> ''
"""

query_status_counts = """
    SELECT status, COUNT(*)
    FROM repair_cards
    GROUP BY status
    ORDER BY status
"""

query_samples = """
    SELECT id, status, image_url
    FROM repair_cards
    ORDER BY id DESC
    LIMIT 5
"""

with engine.connect() as conn:
    total = conn.execute(text(query_total)).scalar()
    with_images = conn.execute(text(query_with_images)).scalar()
    status_counts = conn.execute(text(query_status_counts)).fetchall()
    samples = conn.execute(text(query_samples)).fetchall()

print('Total registros:', total)
print('Con imagen:', with_images)
print('Por estado:', status_counts)
print('Muestras recientes:', samples)
