import os
import sys

# Add backend directory to Python path
sys.path.insert(0, 'c:/Users/nafta/OneDrive/שולחן העבודה/Pikud360/backend')

from dotenv import load_dotenv
load_dotenv('c:/Users/nafta/OneDrive/שולחן העבודה/Pikud360/backend/.env')

from app.database.connection import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Fetch tenants
            cur.execute("SELECT id, name, code FROM core.tenants;")
            tenants = cur.fetchall()
            print("=== TENANTS ===")
            for t in tenants:
                print(t)
            
            # 2. Fetch organization unit types
            cur.execute("SELECT id, name, rank FROM core.organization_unit_types ORDER BY rank;")
            types = cur.fetchall()
            print("\n=== ORGANIZATION UNIT TYPES ===")
            for ty in types:
                print(ty)
            
            # 3. Fetch organization units count
            cur.execute("SELECT id, name, code, parent_id, type_id FROM core.organization_units;")
            units = cur.fetchall()
            print(f"\n=== ORGANIZATION UNITS (Count: {len(units)}) ===")
            for u in units:
                print(u)
except Exception as e:
    print("Database connection or query failed:", e)
