import re
import logging
from typing import Dict, List, Optional, Set, Any
from app.database.connection import get_db_connection

logger = logging.getLogger("matzevet.core.authorization.org_hierarchy")

FULL_ORGANIZATION_STRUCTURE = [
    {
        "id": 1,
        "name": "מחלקת טכנולוגיות",
        "code": "TECH_DEPT",
        "sections": [
            {
                "id": 101,
                "name": "מדור הסייבר המבצעי",
                "code": "TECH_OPS_CYBER_SECT",
                "teams": [
                    {"id": 1001, "name": "חוליית מו\"פ"},
                    {"id": 1002, "name": "חוליית סייבר מבצעי"},
                    {"id": 1003, "name": "חוליית נגישות בסייבר"}
                ]
            },
            {
                "id": 102,
                "name": "מדור מערכות הסייבר",
                "code": "TECH_CYBER_SYS_SECT",
                "teams": [
                    {"id": 1004, "name": "חוליית חברות תקשורת"},
                    {"id": 1005, "name": "חולייה פרויקטים ואמצעים"}
                ]
            },
            {
                "id": 103,
                "name": "מדור סיגמ\"ה",
                "code": "TECH_SIGMA_SECT",
                "teams": [
                    {"id": 1006, "name": "חוליית אמצעי קצה"},
                    {"id": 1007, "name": "חוליית סיוע מבצעי"},
                    {"id": 1008, "name": "חוליית מענים מהירים"}
                ]
            }
        ]
    },
    {
        "id": 2,
        "name": "מחלקת התעצמות",
        "code": "EMPOWERMENT_DEPT",
        "sections": [
            {
                "id": 201,
                "name": "מדור תכנון ייעודי ואסטרטגיה",
                "code": "EMP_STRAT_PLAN_SECT",
                "teams": [
                    {"id": 2001, "name": "חוליית תקציב"},
                    {"id": 2002, "name": "חוליית מערכה (אורית)"},
                    {"id": 2003, "name": "חוליית מערכה (רפאל)"},
                    {"id": 2004, "name": "חוליית נ\"מ"},
                    {"id": 2005, "name": "חוליית קש\"ח ושותפויות"}
                ]
            },
            {
                "id": 202,
                "name": "מדור הכוונה מבצעית",
                "code": "EMP_OPS_DIR_SECT",
                "teams": [
                    {"id": 2006, "name": "חוליית הפקה ארצית"},
                    {"id": 2007, "name": "חוליית ב\"ר"},
                    {"id": 2008, "name": "חוליית סייבר"},
                    {"id": 2009, "name": "חוליית מחת\"ק"},
                    {"id": 2010, "name": "חוליית בקרות"}
                ]
            }
        ]
    },
    {
        "id": 3,
        "name": "מחלקת מענה מבצעי",
        "code": "OPERATIONAL_RESPONSE_DEPT",
        "sections": [
            {
                "id": 301,
                "name": "מדור שטח",
                "code": "OPS_FIELD_SECT",
                "teams": [
                    {"id": 3001, "name": "חוליית מ\"מ"},
                    {"id": 3002, "name": "חוליית ביטחון מידע וחסיונות"},
                    {"id": 3003, "name": "חוליית חות\"ם"},
                    {"id": 3004, "name": "חוליית חוס\"ם"}
                ]
            },
            {
                "id": 302,
                "name": "מדור יחידות ארציות",
                "code": "OPS_NAT_UNITS_SECT",
                "teams": [
                    {"id": 3005, "name": "חוליית סלע"},
                    {"id": 3006, "name": "חוליית שהם"},
                    {"id": 3007, "name": "חוליית רשויות"},
                    {"id": 3008, "name": "חוליית קיסר"}
                ]
            },
            {
                "id": 303,
                "name": "מדור שליטה מבצעית",
                "code": "OPS_CONTROL_SECT",
                "teams": [
                    {"id": 3009, "name": "חוליית 7100"},
                    {"id": 3010, "name": "חוליית 7103"},
                    {"id": 3011, "name": "חוליית משל\"ט טכנו סיגינטי"}
                ]
            },
            {
                "id": 304,
                "name": "מדור סייבר ארצי",
                "code": "OPS_NAT_CYBER_SECT",
                "teams": [
                    {"id": 3012, "name": "חוליית מס\"א"},
                    {"id": 3013, "name": "חוליית קריפטו"}
                ]
            }
        ]
    }
]


def get_org_hierarchy_map() -> Dict[str, Dict[str, Any]]:
    """Builds a lookup mapping from any unit ID / UUID / code to its full department/section/team hierarchy."""
    mapping = {}
    for d in FULL_ORGANIZATION_STRUCTURE:
        d_id = str(d["id"])
        d_name = d["name"]
        d_code = d.get("code")
        d_info = {
            "dept_id": d_id,
            "department_id": int(d_id),
            "department_name": d_name,
            "sect_id": None,
            "section_id": None,
            "section_name": None,
            "team_id": None,
            "team_name": None,
        }
        mapping[d_id] = d_info
        mapping[f"00000000-0000-0000-0000-{int(d_id):012d}"] = d_info
        if d_code:
            mapping[d_code] = d_info

        for s in d.get("sections", []):
            s_id = str(s["id"])
            s_name = s["name"]
            s_code = s.get("code")
            s_info = {
                "dept_id": d_id,
                "department_id": int(d_id),
                "department_name": d_name,
                "sect_id": s_id,
                "section_id": int(s_id),
                "section_name": s_name,
                "team_id": None,
                "team_name": None,
            }
            mapping[s_id] = s_info
            mapping[f"00000000-0000-0000-0000-{int(s_id):012d}"] = s_info
            if s_code:
                mapping[s_code] = s_info

            for t in s.get("teams", []):
                t_id = str(t["id"])
                t_name = t["name"]
                t_code = t.get("code")
                t_info = {
                    "dept_id": d_id,
                    "department_id": int(d_id),
                    "department_name": d_name,
                    "sect_id": s_id,
                    "section_id": int(s_id),
                    "section_name": s_name,
                    "team_id": int(t_id),
                    "team_name": t_name,
                }
                mapping[t_id] = t_info
                mapping[f"00000000-0000-0000-0000-{int(t_id):012d}"] = t_info
                if t_code:
                    mapping[t_code] = t_info

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, code FROM core.organization_units WHERE deleted_at IS NULL;")
                for r in cur.fetchall():
                    u_id, u_name, u_code = str(r[0]), r[1], r[2] or ""
                    if u_id not in mapping:
                        if u_code in mapping:
                            mapping[u_id] = mapping[u_code]
                        else:
                            m = re.search(r"(\d+)$", u_code)
                            if m and m.group(1) in mapping:
                                mapping[u_id] = mapping[m.group(1)]
    except Exception as e:
        logger.warning(f"Failed to map core.organization_units: {e}")

    return mapping


def get_user_effective_scope(user_id: Optional[str], claims: Optional[dict] = None) -> Dict[str, Any]:
    """
    CRITICAL SERVER-SIDE AUTHORIZATION:
    Independently determines the authenticated user's effective organization scope.
    Never trusts client parameters or unverified flags.
    If an admin is impersonating a user, the effective scope is strictly the impersonated user's scope.
    """
    if not user_id:
        return {
            "level": "none",
            "is_admin": False,
            "allowed_dept_ids": [],
            "allowed_sect_ids": [],
            "allowed_team_ids": [],
            "allowed_unit_ids": set(),
            "department_id": None,
            "section_id": None,
            "team_id": None,
            "department_name": None,
            "section_name": None,
            "team_name": None,
            "assigned_department_id": None,
            "assigned_section_id": None,
            "assigned_team_id": None,
            "commands_department_id": None,
            "commands_section_id": None,
            "commands_team_id": None,
        }

    claims = claims or {}
    is_impersonated = bool(claims.get("is_impersonated", False))
    roles = claims.get("roles", [])

    # Check if user is truly system administrator (impersonated users are NEVER treated as admin)
    is_admin = False
    if not is_impersonated:
        if str(user_id) == "admin" or "ADMIN" in roles:
            is_admin = True
        else:
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT username, email FROM security.users WHERE id::text = %s OR username = %s;",
                            (str(user_id), str(user_id))
                        )
                        u_row = cur.fetchone()
                        if u_row and (u_row[0] == "admin" or u_row[1] == "admin@matzevet.gov.il"):
                            is_admin = True
            except Exception as e:
                logger.warning(f"Error checking admin status: {e}")

    if is_admin:
        return {
            "level": "global",
            "is_admin": True,
            "allowed_dept_ids": None,  # None means unrestricted
            "allowed_sect_ids": None,
            "allowed_team_ids": None,
            "allowed_unit_ids": None,
            "department_id": None,
            "section_id": None,
            "team_id": None,
            "department_name": None,
            "section_name": None,
            "team_name": None,
            "assigned_department_id": None,
            "assigned_section_id": None,
            "assigned_team_id": None,
            "commands_department_id": None,
            "commands_section_id": None,
            "commands_team_id": None,
        }

    # For non-admin user (or impersonated non-admin user):
    emp_record = None
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, employee_number, first_name, last_name, org_unit_id, position, rank, user_id
                    FROM workforce.employees
                    WHERE (user_id::text = %s OR id::text = %s OR employee_number = %s)
                      AND deleted_at IS NULL;
                """, (str(user_id), str(user_id), str(user_id)))
                emp_record = cur.fetchone()

                # If not matched by user_id directly, find username from security.users
                if not emp_record:
                    cur.execute("SELECT username FROM security.users WHERE id::text = %s;", (str(user_id),))
                    u_r = cur.fetchone()
                    if u_r and u_r[0]:
                        cur.execute("""
                            SELECT id, employee_number, first_name, last_name, org_unit_id, position, rank, user_id
                            FROM workforce.employees
                            WHERE employee_number = %s AND deleted_at IS NULL;
                        """, (u_r[0],))
                        emp_record = cur.fetchone()
    except Exception as e:
        logger.error(f"Error fetching employee scope for {user_id}: {e}")

    if not emp_record or not emp_record[4]:
        return {
            "level": "none",
            "is_admin": False,
            "allowed_dept_ids": [],
            "allowed_sect_ids": [],
            "allowed_team_ids": [],
            "allowed_unit_ids": set(),
            "department_id": None,
            "section_id": None,
            "team_id": None,
            "department_name": None,
            "section_name": None,
            "team_name": None,
            "assigned_department_id": None,
            "assigned_section_id": None,
            "assigned_team_id": None,
            "commands_department_id": None,
            "commands_section_id": None,
            "commands_team_id": None,
        }

    org_map = get_org_hierarchy_map()
    h = org_map.get(str(emp_record[4])) or {}

    dept_id = str(h.get("dept_id")) if h.get("dept_id") else None
    sect_id = str(h.get("sect_id")) if h.get("sect_id") else None
    team_id = str(h.get("team_id")) if h.get("team_id") else None

    position = (emp_record[5] or "").strip()
    rank = (emp_record[6] or "").strip()

    # Determine command level
    if "מחלקה" in position and dept_id:
        level = "department"
        allowed_dept_ids = [dept_id]
        allowed_sect_ids = [
            str(s["id"])
            for d in FULL_ORGANIZATION_STRUCTURE
            if str(d["id"]) == dept_id
            for s in d.get("sections", [])
        ]
        allowed_team_ids = [
            str(t["id"])
            for d in FULL_ORGANIZATION_STRUCTURE
            if str(d["id"]) == dept_id
            for s in d.get("sections", [])
            for t in s.get("teams", [])
        ]
        commands_department_id = int(dept_id)
        commands_section_id = None
        commands_team_id = None

    elif "מדור" in position and sect_id:
        level = "section"
        allowed_dept_ids = [dept_id] if dept_id else []
        allowed_sect_ids = [sect_id]
        allowed_team_ids = [
            str(t["id"])
            for d in FULL_ORGANIZATION_STRUCTURE
            for s in d.get("sections", [])
            if str(s["id"]) == sect_id
            for t in s.get("teams", [])
        ]
        commands_department_id = None
        commands_section_id = int(sect_id)
        commands_team_id = None

    elif team_id:
        level = "team"
        allowed_dept_ids = [dept_id] if dept_id else []
        allowed_sect_ids = [sect_id] if sect_id else []
        allowed_team_ids = [team_id]
        commands_department_id = None
        commands_section_id = None
        commands_team_id = int(team_id)

    elif sect_id:
        level = "section"
        allowed_dept_ids = [dept_id] if dept_id else []
        allowed_sect_ids = [sect_id]
        allowed_team_ids = [
            str(t["id"])
            for d in FULL_ORGANIZATION_STRUCTURE
            for s in d.get("sections", [])
            if str(s["id"]) == sect_id
            for t in s.get("teams", [])
        ]
        commands_department_id = None
        commands_section_id = int(sect_id)
        commands_team_id = None
    else:
        level = "department"
        allowed_dept_ids = [dept_id] if dept_id else []
        allowed_sect_ids = []
        allowed_team_ids = []
        commands_department_id = int(dept_id) if dept_id else None
        commands_section_id = None
        commands_team_id = None

    # Build full set of allowed DB unit IDs (including UUID formats)
    allowed_unit_ids = set()
    for d_i in allowed_dept_ids:
        allowed_unit_ids.add(d_i)
        try:
            allowed_unit_ids.add(f"00000000-0000-0000-0000-{int(d_i):012d}")
        except Exception:
            pass

    for s_i in allowed_sect_ids:
        allowed_unit_ids.add(s_i)
        try:
            allowed_unit_ids.add(f"00000000-0000-0000-0000-{int(s_i):012d}")
        except Exception:
            pass

    for t_i in allowed_team_ids:
        allowed_unit_ids.add(t_i)
        try:
            allowed_unit_ids.add(f"00000000-0000-0000-0000-{int(t_i):012d}")
        except Exception:
            pass

    if emp_record[4]:
        allowed_unit_ids.add(str(emp_record[4]))

    return {
        "level": level,
        "is_admin": False,
        "allowed_dept_ids": allowed_dept_ids,
        "allowed_sect_ids": allowed_sect_ids,
        "allowed_team_ids": allowed_team_ids,
        "allowed_unit_ids": allowed_unit_ids,
        "department_id": int(dept_id) if dept_id else None,
        "section_id": int(sect_id) if sect_id else None,
        "team_id": int(team_id) if team_id else None,
        "department_name": h.get("department_name"),
        "section_name": h.get("section_name"),
        "team_name": h.get("team_name"),
        "assigned_department_id": int(dept_id) if dept_id else None,
        "assigned_section_id": int(sect_id) if sect_id else None,
        "assigned_team_id": int(team_id) if team_id else None,
        "commands_department_id": commands_department_id,
        "commands_section_id": commands_section_id,
        "commands_team_id": commands_team_id,
    }


def filter_structure_for_scope(scope: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Filters the full organization structure strictly to units the user is permitted to see.
    Prevents leaking unauthorized departments, sections, or teams in metadata responses.
    """
    if scope.get("is_admin") or scope.get("level") == "global":
        return FULL_ORGANIZATION_STRUCTURE

    allowed_depts = set(scope.get("allowed_dept_ids") or [])
    allowed_sects = set(scope.get("allowed_sect_ids") or [])
    allowed_teams = set(scope.get("allowed_team_ids") or [])

    filtered_departments = []
    for d in FULL_ORGANIZATION_STRUCTURE:
        if str(d["id"]) not in allowed_depts:
            continue

        filtered_sections = []
        for s in d.get("sections", []):
            if str(s["id"]) not in allowed_sects:
                continue

            filtered_teams = [
                t for t in s.get("teams", [])
                if str(t["id"]) in allowed_teams
            ]

            filtered_sections.append({
                **s,
                "teams": filtered_teams
            })

        filtered_departments.append({
            **d,
            "sections": filtered_sections
        })

    return filtered_departments
