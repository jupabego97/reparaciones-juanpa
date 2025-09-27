from dotenv import load_dotenv
load_dotenv()

import os
from sqlalchemy import create_engine, text

engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    rows = conn.execute(text('SELECT id, owner_name, image_url FROM repair_cards WHERE image_url IS NOT NULL AND image_url <> '''' ORDER BY id DESC LIMIT 10')).fetchall()

for row in rows:
    print(row[0], bool(row[2]), row[2][:80])
