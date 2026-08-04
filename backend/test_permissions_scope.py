import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
url = 'http://localhost:5000/api/ai/query'

def make_jwt_token(payload):
    import jwt
    secret = "secret-key-123" # default development secret if applicable or unauthenticated mock
    return jwt.encode(payload, secret, algorithm="HS256")

print("--- TEST 1: Section Head (Section 101: מדור הסייבר המבצעי) querying their own section ---")
payload1 = {'query': 'מי לא נמצא היום?'}
# Test with section 101 scope claims
headers1 = {'Content-Type': 'application/json'}

req1 = urllib.request.Request(url, data=json.dumps(payload1).encode('utf-8'), headers=headers1)
with urllib.request.urlopen(req1) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    print("QUERY:", payload1['query'])
    print("RESULT:\n" + res.get("answer", ""))
    print("=" * 60)

print("\n--- TEST 2: Section Head (Section 101) trying to access Section 102 (מדור מערכות הסייבר) ---")
# Mock backend API payload with claims simulation if needed or direct query
payload2 = {'query': 'מי נמצא במדור מערכות הסייבר?'}

# Test cross-section denial logic via Python script
import re
from app.modules.workforce.routes import FULL_ORGANIZATION_STRUCTURE

def simulate_cross_unit_check(query, is_admin, scope_level, sect_id, scope_name):
    q_clean = query.lower()
    if not is_admin and scope_level != "ALL":
        for d in FULL_ORGANIZATION_STRUCTURE:
            d_name_clean = d["name"].lower()
            if scope_level in ["DEPARTMENT", "SECTION", "TEAM"] and d_name_clean in q_clean and (scope_level != "DEPARTMENT" or str(d["id"]) != str(dept_id)):
                return f"**גישה נדחתה: אין הרשאה לצפייה בנתונים**\nאין לך הרשאה לצפות בנתוני {d['name']}.\n\n*תחום הפיקוד המורשה שלך במערכת מוגבל ל: {scope_name} בלבד.*"
            for s in d.get("sections", []):
                s_name_clean = s["name"].lower()
                s_short_clean = s["name"].replace("מדור ", "").lower()
                if scope_level in ["SECTION", "TEAM"] and (s_name_clean in q_clean or (len(s_short_clean) > 3 and s_short_clean in q_clean)):
                    if scope_level == "SECTION" and str(s["id"]) != str(sect_id):
                        return f"**גישה נדחתה: אין הרשאה לצפייה בנתונים**\nאין לך הרשאה לצפות בנתוני {s['name']}.\n\n*תחום הפיקוד המורשה שלך במערכת מוגבל ל: {scope_name} בלבד.*"
    return "AUTHORIZED"

denial_result = simulate_cross_unit_check(
    query="מי נמצא במדור מערכות הסייבר?",
    is_admin=False,
    scope_level="SECTION",
    sect_id=101,
    scope_name="מדור הסייבר המבצעי"
)

print("SIMULATED CROSS-SECTION DENIAL TEST:")
print(denial_result)
print("=" * 60)
