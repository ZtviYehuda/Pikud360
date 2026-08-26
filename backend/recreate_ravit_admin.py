import sys
import uuid
import json
import bcrypt
sys.path.insert(0, '.')
from app.database.connection import get_db_connection
from app.modules.workforce.repositories import EmployeeRepository
from app.modules.workforce.models import Employee

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

tenant_id = "00000000-0000-0000-0000-000000000001"
top_org_unit_id = "00000000-0000-0000-0000-000000000001"

with get_db_connection() as conn:
    with conn.cursor() as cur:
        # 1. Clean old Ravit records completely
        cur.execute("SELECT id FROM security.users WHERE LOWER(username) LIKE '%ravit%' OR LOWER(email) LIKE '%ravit%' OR LOWER(username) LIKE '%רוית%';")
        old_user_ids = [row[0] for row in cur.fetchall()]
        for uid in old_user_ids:
            cur.execute("DELETE FROM security.user_roles WHERE user_id = %s;", (uid,))
            cur.execute("DELETE FROM security.user_preferences WHERE user_id = %s;", (uid,))
            cur.execute("DELETE FROM security.user_sessions WHERE user_id = %s;", (uid,))
            cur.execute("DELETE FROM security.users WHERE id = %s;", (uid,))

        cur.execute("DELETE FROM workforce.employees WHERE first_name ILIKE '%רוית%' OR last_name ILIKE '%רוית%' OR first_name ILIKE '%ravit%' OR last_name ILIKE '%ravit%' OR employee_number ILIKE '%ravit%';")

        # 2. Create the brand new user "Ravit Admin"
        new_user_id = str(uuid.uuid4())
        username = "Ravit Admin"
        email = "ravit.admin@matzevet.gov.il"
        password_hash = hash_pw("123456")

        cur.execute("""
            INSERT INTO security.users (id, tenant_id, username, email, password_hash, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        """, (new_user_id, tenant_id, username, email, password_hash))
        print(f"Created new user '{username}' with ID {new_user_id}")

        # 3. Assign Roles: ADMIN and COMMANDER
        cur.execute("SELECT id FROM security.roles WHERE name = 'ADMIN';")
        admin_role_id = cur.fetchone()[0]
        cur.execute("SELECT id FROM security.roles WHERE name = 'COMMANDER';")
        cmd_role_id = cur.fetchone()[0]

        cur.execute("INSERT INTO security.user_roles (user_id, role_id) VALUES (%s, %s);", (new_user_id, admin_role_id))
        cur.execute("INSERT INTO security.user_roles (user_id, role_id) VALUES (%s, %s);", (new_user_id, cmd_role_id))
        print(f"Assigned ADMIN and COMMANDER roles")

        # 4. User Preferences
        display_prefs = {
            "first_name": "רוית",
            "last_name": "אדמין",
            "display_name": "רוית אדמין",
            "phone_number": "0527506058",
            "is_commander": True,
            "city": "תל אביב",
            "police_license": True,
            "security_clearance": True,
            "birth_date": "1995-05-15"
        }
        cur.execute("""
            INSERT INTO security.user_preferences (user_id, theme, language, notification_preferences, dashboard_layout, default_page, table_density, accessibility_preferences, display_preferences, updated_at)
            VALUES (%s, 'light', 'he', '{}', '{}', '/dashboard', 'comfortable', '{}', %s, CURRENT_TIMESTAMP);
        """, (new_user_id, json.dumps(display_prefs, ensure_ascii=False)))
        print("Created user preferences")
        conn.commit()

# 5. Create linked Employee record via EmployeeRepository
emp_repo = EmployeeRepository()
emp = Employee(
    id=str(uuid.uuid4()),
    tenant_id=tenant_id,
    org_unit_id=top_org_unit_id,
    employee_number="RAVIT_ADMIN",
    first_name="רוית",
    last_name="אדמין",
    rank="רס\"ן",
    position="סגנית מנהל מערכת",
    service_type="קבע - קצין",
    status="PRESENT",
    phone="0527506058",
    personal_email="ravit.admin@matzevet.gov.il",
    birthdate="1995-05-15",
    city="תל אביב",
    user_id=new_user_id
)
created = emp_repo.create(emp, created_by_user_id=new_user_id)
print(f"Successfully created Employee: {created.first_name} {created.last_name} ({created.employee_number})")
print("\nALL TASKS COMPLETED SUCCESSFULLY!")
