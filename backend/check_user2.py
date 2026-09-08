from app.database.connection import get_db_connection

with get_db_connection() as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'security' AND table_name = 'user_preferences';")
        print('User prefs columns:', [r[0] for r in cur.fetchall()])
        cur.execute("SELECT * FROM security.user_preferences WHERE user_id = 'ec37c3e4-02bb-402f-8e4d-5d560d38ea24';")
        print('User prefs rows:', cur.fetchall())
        cur.execute("SELECT ur.user_id, r.name FROM security.user_roles ur JOIN security.roles r ON r.id = ur.role_id WHERE ur.user_id = 'ec37c3e4-02bb-402f-8e4d-5d560d38ea24';")
        print('User roles:', cur.fetchall())
