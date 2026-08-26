import sys
sys.path.insert(0, '.')
from app.database.connection import get_db_connection

with get_db_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM core.organization_units LIMIT 10;")
        print("Org units:", cur.fetchall())
        cur.execute("SELECT id, name FROM core.organization_units WHERE name ILIKE '%ניהול%' OR name ILIKE '%טכנולוג%' OR name ILIKE '%מפקד%';")
        print("Matching org units:", cur.fetchall())
