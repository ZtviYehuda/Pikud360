import uuid
import random
from datetime import date, timedelta
from app.database.connection import get_db_connection

def seed_schedules():
    print("[*] Starting schedule seed around 2026-09-09...")
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Fetch all employees
            cur.execute("""
                SELECT id, org_unit_id, first_name, last_name 
                FROM workforce.employees 
                WHERE deleted_at IS NULL;
            """)
            employees = cur.fetchall()
            print(f"[+] Found {len(employees)} active employees.")

            # 2. Fetch statuses
            cur.execute("SELECT id, code, name, category, color FROM workforce.schedule_statuses;")
            statuses = cur.fetchall()
            status_by_code = {r[1]: str(r[0]) for r in statuses}
            default_status_id = statuses[0][0]

            available_id = status_by_code.get("AVAILABLE", default_status_id)
            sick_id = status_by_code.get("SICK", default_status_id)
            vacation_id = status_by_code.get("VACATION", default_status_id)
            training_id = status_by_code.get("TRAINING", default_status_id)
            mission_id = status_by_code.get("MISSION", default_status_id)
            reinforcement_id = status_by_code.get("REINFORCEMENT", default_status_id)

            status_weights = [
                (available_id, 0.60),       # 60% Office / Available
                (vacation_id, 0.15),        # 15% Vacation
                (sick_id, 0.08),            # 8% Sick
                (training_id, 0.07),        # 7% Training
                (mission_id, 0.05),         # 5% Mission
                (reinforcement_id, 0.05),   # 5% Reinforcement
            ]

            # Date range: 60 days in past to 30 days in future from 2026-09-09
            base_date = date(2026, 9, 9)
            date_range = [base_date - timedelta(days=d) for d in range(60, 0, -1)] + [base_date + timedelta(days=d) for d in range(0, 31)]

            print(f"[+] Generating schedules for {len(date_range)} days ({date_range[0]} to {date_range[-1]})...")

            # Delete existing schedules in this range to avoid duplicates
            cur.execute("""
                DELETE FROM workforce.employee_daily_schedule
                WHERE schedule_date BETWEEN %s AND %s;
            """, (date_range[0], date_range[-1]))

            # Fetch tenant id
            cur.execute("SELECT id FROM core.tenants LIMIT 1;")
            tenant_row = cur.fetchone()
            tenant_id = str(tenant_row[0]) if tenant_row else str(uuid.uuid4())

            insert_count = 0
            for emp in employees:
                emp_id = str(emp[0])
                org_unit_id = str(emp[1]) if emp[1] else None

                # Seed realistic per-employee patterns
                emp_seed = abs(hash(emp_id))
                random.seed(emp_seed)

                # Base tendency for this employee
                is_mostly_present = (emp_seed % 10) < 8  # 80% of employees are mostly present

                for d in date_range:
                    is_weekend = d.weekday() in (4, 5) # Fri, Sat
                    
                    if is_weekend:
                        # 90% weekend off / absent unless on duty
                        if random.random() < 0.88:
                            continue
                        chosen_status = reinforcement_id if random.random() < 0.5 else mission_id
                    else:
                        if is_mostly_present:
                            roll = random.random()
                            if roll < 0.72:
                                chosen_status = available_id
                            elif roll < 0.84:
                                chosen_status = vacation_id
                            elif roll < 0.90:
                                chosen_status = training_id
                            elif roll < 0.95:
                                chosen_status = reinforcement_id
                            else:
                                chosen_status = sick_id
                        else:
                            # Occasional absence / training
                            roll = random.random()
                            if roll < 0.45:
                                chosen_status = available_id
                            elif roll < 0.70:
                                chosen_status = vacation_id
                            elif roll < 0.85:
                                chosen_status = sick_id
                            else:
                                chosen_status = training_id

                    sched_id = str(uuid.uuid4())
                    cur.execute("""
                        INSERT INTO workforce.employee_daily_schedule (
                            id, tenant_id, employee_id, organization_unit_id, schedule_date,
                            status_id, created_at, updated_at
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            %s, NOW(), NOW()
                        );
                    """, (sched_id, tenant_id, emp_id, org_unit_id, d, chosen_status))
                    insert_count += 1

            conn.commit()
            print(f"[SUCCESS] Successfully seeded {insert_count} schedules across {len(employees)} employees!")

if __name__ == "__main__":
    seed_schedules()
