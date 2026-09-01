import os
import sys
import uuid
import random
from datetime import datetime, date, timedelta

# Add backend root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.database.connection import get_db_connection
from app.modules.workforce.encryption import encrypt_value, generate_blind_index

FIRST_NAMES_MALE = [
    "דניאל", "יוסי", "איתי", "נועם", "עומר", "אביב", "רועי", "יונתן", "מתן", "אריאל",
    "גיא", "עידו", "תומר", "אלון", "אורי", "אור", "דור", "עידן", "ליאור", "שחר"
]

FIRST_NAMES_FEMALE = [
    "נועה", "מאיה", "תמר", "שירה", "יעל", "רוני", "אגם", "עדי", "טל", "הילה",
    "מיכל", "שני", "דנה", "מור", "לירון"
]

LAST_NAMES = [
    "כהן", "לוי", "מזרחי", "פרץ", "ביטון", "דהן", "אברהם", "פרידמן", "מלכה", "אזולאי",
    "חדד", "כץ", "יוסף", "עמר", "אוחיון", "גבאי", "שלום", "בן דוד", "וקנין", "שוורץ"
]

RANKS = ["רס\"ל", "רס\"ר", "רס\"ם", "רס\"ב", "רנ\"ג", "פקד", "רפ\"ק", "סנ\"צ", "נצ\"מ"]

POSITIONS = [
    "מפעיל מערכות", "חוקר בכיר", "אנליסט מודיעין", "קצין מבצעים", "רכז הדרכה",
    "טכנאי תקשוב", "סייר מבצעי", "מנהל רשת", "ראש צוות בקרה", "נציג שירות",
    "מפתח מערכות", "בודק תוכנה", "אחראי לוגיסטיקה", "רכז כוח אדם", "קצין תורן"
]

SERVICE_TYPES = ["חובה", "קבע", "מילואים", "אזרח עובד צה\"ל"]

STATUS_DISTRIBUTION = [
    ("AVAILABLE", 0.55),      # 55% נוכח
    ("SICK", 0.12),           # 12% מחלה
    ("VACATION", 0.15),       # 15% חופשה
    ("TRAINING", 0.08),       # 8% הדרכה
    ("MISSION", 0.05),        # 5% משימה
    ("REINFORCEMENT", 0.05),  # 5% תגבור
]

def choose_status_code():
    r = random.random()
    cumulative = 0.0
    for code, weight in STATUS_DISTRIBUTION:
        cumulative += weight
        if r <= cumulative:
            return code
    return "AVAILABLE"

def run_seed():
    app = create_app()
    with app.app_context():
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. Resolve Tenant ID
                cur.execute("SELECT id FROM core.tenants LIMIT 1;")
                tenant_row = cur.fetchone()
                tenant_id = str(tenant_row[0]) if tenant_row else "00000000-0000-0000-0000-000000000001"
                print(f"[+] Active Tenant ID: {tenant_id}")

                # Resolve an admin user for created_by
                cur.execute("SELECT id FROM security.users LIMIT 1;")
                user_row = cur.fetchone()
                creator_user_id = str(user_row[0]) if user_row else str(uuid.uuid4())
                print(f"[+] Creator User ID: {creator_user_id}")

                # 2. Check and get Organization Units
                cur.execute("SELECT id, name, type_id, parent_id FROM core.organization_units WHERE deleted_at IS NULL ORDER BY sort_order, name;")
                org_units = cur.fetchall()
                print(f"[+] Found {len(org_units)} existing org units in core.organization_units")

                # Leaf units (teams / sections / units)
                leaf_units = [u[0] for u in org_units if u[2] == 'TEAM']
                if not leaf_units:
                    leaf_units = [u[0] for u in org_units if u[2] == 'SECTION']
                if not leaf_units:
                    leaf_units = [u[0] for u in org_units]
                
                print(f"[+] Total selectable leaf units: {len(leaf_units)}")

                # 3. Fetch or Seed Schedule Statuses
                cur.execute("SELECT id, code FROM workforce.schedule_statuses WHERE is_active = true;")
                status_rows = cur.fetchall()
                if not status_rows:
                    print("[+] Auto-seeding workforce.schedule_statuses...")
                    defaults = [
                        ("AVAILABLE", "נוכח", "AVAILABLE", "#10B981", 10),
                        ("SICK", "מחלה", "SICK", "#EF4444", 20),
                        ("VACATION", "חופשה", "VACATION", "#F59E0B", 30),
                        ("TRAINING", "הדרכה", "TRAINING", "#8B5CF6", 40),
                        ("MISSION", "משימה", "MISSION", "#3B82F6", 50),
                        ("REINFORCEMENT", "תגבור", "REINFORCEMENT", "#06B6D4", 60),
                        ("UNAVAILABLE", "לא זמין", "UNAVAILABLE", "#6B7280", 70),
                        ("OTHER", "אחר", "OTHER", "#64748B", 80)
                    ]
                    for code, name, cat, color, order in defaults:
                        cur.execute("""
                            INSERT INTO workforce.schedule_statuses (id, tenant_id, code, name, category, color, is_active, sort_order, created_by, created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, true, %s, %s, NOW(), NOW())
                            ON CONFLICT DO NOTHING;
                        """, (str(uuid.uuid4()), tenant_id, code, name, cat, color, order, creator_user_id))
                    
                    cur.execute("SELECT id, code FROM workforce.schedule_statuses WHERE is_active = true;")
                    status_rows = cur.fetchall()

                code_to_status_id = {row[1]: str(row[0]) for row in status_rows}
                default_status_id = list(code_to_status_id.values())[0] if code_to_status_id else str(uuid.uuid4())
                print(f"[+] Loaded {len(code_to_status_id)} schedule statuses: {list(code_to_status_id.keys())}")

                # 4. Generate 32 Realistic Employees
                all_names = FIRST_NAMES_MALE + FIRST_NAMES_FEMALE
                created_employees = []

                print("[+] Generating 32 realistic employees with full organizational assignments...")
                for i in range(1, 33):
                    emp_id = str(uuid.uuid4())
                    first_name = random.choice(all_names)
                    last_name = random.choice(LAST_NAMES)
                    emp_num = f"{random.randint(7100000, 9999999)}"
                    
                    birth_year = random.randint(1982, 2003)
                    birth_month = random.randint(1, 12)
                    birth_day = random.randint(1, 28)
                    birthdate_str = f"{birth_year}-{birth_month:02d}-{birth_day:02d}"
                    
                    rank = random.choice(RANKS)
                    position = random.choice(POSITIONS)
                    service_type = random.choice(SERVICE_TYPES)
                    assigned_unit_id = random.choice(leaf_units)
                    phone = f"05{random.randint(0,4)}-{random.randint(1000000, 9999999)}"
                    email = f"{emp_num}@police.gov.il"
                    city = random.choice(["תל אביב", "ירושלים", "חיפה", "ראשון לציון", "באר שבע", "פתח תקווה", "נתניה", "אשדוד", "חולון", "רמת גן", "רחובות", "מודיעין"])

                    # Encrypt PII
                    phone_cipher, phone_nonce, phone_tag = encrypt_value(phone)
                    email_cipher, email_nonce, email_tag = encrypt_value(email)
                    birth_cipher, birth_nonce, birth_tag = encrypt_value(birthdate_str)
                    phone_blind = generate_blind_index(phone)
                    email_blind = generate_blind_index(email)

                    cur.execute("""
                        INSERT INTO workforce.employees (
                            id, org_unit_id, employee_number, first_name, last_name,
                            phone_ciphertext, phone_nonce, phone_tag, phone_blind_index,
                            email_ciphertext, email_nonce, email_tag, email_blind_index,
                            birthdate_ciphertext, birthdate_nonce, birthdate_tag,
                            rank, position, service_type, status, city,
                            created_by, updated_by, created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            %s, %s, %s,
                            %s, %s, %s, 'ACTIVE', %s,
                            %s, %s, NOW(), NOW()
                        ) RETURNING id;
                    """, (
                        emp_id, assigned_unit_id, emp_num, first_name, last_name,
                        phone_cipher, phone_nonce, phone_tag, phone_blind,
                        email_cipher, email_nonce, email_tag, email_blind,
                        birth_cipher, birth_nonce, birth_tag,
                        rank, position, service_type, city,
                        creator_user_id, creator_user_id
                    ))
                    created_employees.append((emp_id, assigned_unit_id))

                print(f"[+] Successfully inserted {len(created_employees)} employees into workforce.employees!")

                # 5. Generate daily attendance history (past 21 days up to today + next 7 days for roster)
                today = date.today()
                # 21 days past to 7 days future
                date_range = [today - timedelta(days=d) for d in range(21, 0, -1)] + [today + timedelta(days=d) for d in range(0, 8)]
                print(f"[+] Generating attendance & schedule history across {len(date_range)} days...")

                schedules_count = 0
                for emp_id, unit_id in created_employees:
                    # Give each employee a dominant baseline status
                    favored_code = choose_status_code()
                    
                    for cur_date in date_range:
                        # Skip weekends (Fri/Sat) mostly
                        is_weekend = cur_date.weekday() in (4, 5)
                        if is_weekend and random.random() < 0.85:
                            continue

                        # 70% favored status, 30% random
                        code = favored_code if random.random() < 0.70 else choose_status_code()
                        status_id = code_to_status_id.get(code, default_status_id)

                        sched_id = str(uuid.uuid4())
                        cur.execute("""
                            INSERT INTO workforce.employee_daily_schedule (
                                id, tenant_id, employee_id, organization_unit_id, schedule_date,
                                status_id, created_at, updated_at
                            ) VALUES (
                                %s, %s, %s, %s, %s,
                                %s, NOW(), NOW()
                            );
                        """, (sched_id, tenant_id, emp_id, unit_id, cur_date, status_id))
                        schedules_count += 1

                print(f"[+] Successfully created {schedules_count} daily attendance & schedule records!")

                # Commit
                conn.commit()
                print("[SUCCESS] Seeding completed and committed successfully!")

if __name__ == "__main__":
    run_seed()
