from app.database.connection import get_db_connection

with get_db_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id, first_name, last_name, employee_number, org_unit_id, position, rank, user_id FROM workforce.employees WHERE first_name LIKE '%דנה%' OR last_name LIKE '%ביטון%';")
        print('Employees:', cur.fetchall())
        cur.execute("SELECT id, username, email FROM security.users WHERE username LIKE '%9269297%' OR username LIKE '%דנה%';")
        print('Users:', cur.fetchall())
