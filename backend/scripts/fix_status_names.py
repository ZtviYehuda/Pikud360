from app.database.connection import get_db_connection

STATUS_MAP = {
    "AVAILABLE": ("משרד", "AVAILABLE", "#10B981", 1),
    "REINFORCEMENT": ("תגבור", "REINFORCEMENT", "#3B82F6", 2),
    "TRAINING": ("קורס", "TRAINING", "#8B5CF6", 3),
    "MISSION": ("משימה", "MISSION", "#06B6D4", 4),
    "VACATION": ("חופשה", "VACATION", "#F59E0B", 5),
    "SICK": ("מחלה", "SICK", "#EF4444", 6),
    "UNAVAILABLE": ("לא זמין", "UNAVAILABLE", "#94A3B8", 7),
    "OTHER": ("אחר", "OTHER", "#64748B", 8),
}

with get_db_connection() as conn:
    with conn.cursor() as cur:
        for code, (name, category, color, sort_order) in STATUS_MAP.items():
            cur.execute("""
                UPDATE workforce.schedule_statuses
                SET name = %s, category = %s, color = %s, sort_order = %s, is_active = TRUE
                WHERE code = %s;
            """, (name, category, color, sort_order, code))
        conn.commit()
        print("[+] Successfully updated schedule_statuses with proper Hebrew names!")

        cur.execute("SELECT code, name, category, color FROM workforce.schedule_statuses ORDER BY sort_order;")
        for r in cur.fetchall():
            print("  ", r)
