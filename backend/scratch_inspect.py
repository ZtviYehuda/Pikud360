from app.database.connection import get_db_connection

with get_db_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='workforce' AND table_name='schedule_statuses';
        """)
        print("schedule_statuses columns:", cur.fetchall())
        
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema='workforce' AND table_name='employee_daily_schedule';
        """)
        print("employee_daily_schedule columns:", cur.fetchall())
        
        cur.execute("SELECT id, code, name, category, color FROM workforce.schedule_statuses;")
        print("Statuses:")
        for r in cur.fetchall():
            print(" ", r)
