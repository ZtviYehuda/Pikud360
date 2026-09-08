from app.database.connection import get_db_connection
from app.modules.workforce.routes import _get_org_hierarchy_map

with get_db_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id, first_name, last_name, employee_number, org_unit_id, position, rank, user_id FROM workforce.employees WHERE employee_number = '9269297';")
        emp = cur.fetchone()
        org_map = _get_org_hierarchy_map()
        h = org_map.get(str(emp[4]))
        for k, v in h.items():
            print(k, ':', repr(v))
