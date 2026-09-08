import os
import sys
import unittest

# Add backend to path
sys.path.insert(0, r"c:\Users\nafta\OneDrive\שולחן העבודה\Pikud360\backend")

from app import create_app
from app.core.authorization.org_hierarchy import (
    get_user_effective_scope,
    filter_structure_for_scope,
    get_org_hierarchy_map,
)

class TestServerSideAuthorization(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_scope_calculation_dana_biton(self):
        with self.app.app_context():
            # Dana Biton: user_id 'ec37c3e4-02bb-402f-8e4d-5d560d38ea24' (employee '9269297')
            scope = get_user_effective_scope("ec37c3e4-02bb-402f-8e4d-5d560d38ea24", claims={"is_admin": False})
            self.assertEqual(scope["level"], "team")
            self.assertEqual(scope["allowed_team_ids"], ["1004"])
            self.assertEqual(scope["allowed_sect_ids"], ["102"])
            self.assertEqual(scope["allowed_dept_ids"], ["1"])

    def test_impersonation_scope_dana_biton(self):
        with self.app.app_context():
            # When admin impersonates Dana Biton, claims have is_impersonated: True, is_admin: False
            scope = get_user_effective_scope("ec37c3e4-02bb-402f-8e4d-5d560d38ea24", claims={"is_admin": False, "is_impersonated": True})
            self.assertEqual(scope["level"], "team")
            self.assertEqual(scope["allowed_team_ids"], ["1004"])
            # Admin scope must NEVER leak
            self.assertFalse(scope.get("is_global", False))

    def test_filter_structure_for_team_scope(self):
        with self.app.app_context():
            scope = {
                "level": "team",
                "allowed_dept_ids": ["1"],
                "allowed_sect_ids": ["102"],
                "allowed_team_ids": ["1004"],
                "is_global": False
            }
            filtered = filter_structure_for_scope(scope)
            self.assertEqual(len(filtered), 1)
            self.assertEqual(filtered[0]["id"], 1)
            self.assertEqual(len(filtered[0]["sections"]), 1)
            self.assertEqual(filtered[0]["sections"][0]["id"], 102)
            self.assertEqual(len(filtered[0]["sections"][0]["teams"]), 1)
            self.assertEqual(filtered[0]["sections"][0]["teams"][0]["id"], 1004)

    def test_attendance_stats_scoped_and_tamper_attempt(self):
        with self.app.app_context():
            # Login as Dana Biton
            res = self.client.post("/api/v1/auth/login", json={"personal_number": "9269297", "password": "password123"})
            if res.status_code != 200:
                # Try without password or default test credentials if mocked
                print("Login response:", res.status_code, res.get_json())
            token = res.get_json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}

            # 1. Base stats without query params -> returns only team 1004 (1 employee)
            res_stats = self.client.get("/api/v1/workforce/attendance/stats", headers=headers)
            self.assertEqual(res_stats.status_code, 200)
            data = res_stats.get_json()["data"]
            self.assertEqual(data["total_commanders"] + data["total_soldiers"] if "total_commanders" in data else data.get("total_assigned", 1), 1)

            # 2. Tampering attempt: request department_id=2 (unauthorized)
            res_tamper_dept = self.client.get("/api/v1/workforce/attendance/stats?department_id=2", headers=headers)
            self.assertEqual(res_tamper_dept.status_code, 200)
            tamper_data = res_tamper_dept.get_json()["data"]
            self.assertEqual(tamper_data.get("total_assigned", 0), 0)

            # 3. Tampering attempt: request team_id=1005 (unauthorized)
            res_tamper_team = self.client.get("/api/v1/workforce/attendance/stats?team_id=1005", headers=headers)
            self.assertEqual(res_tamper_team.status_code, 200)
            tamper_team_data = res_tamper_team.get_json()["data"]
            self.assertEqual(tamper_team_data.get("total_assigned", 0), 0)

            # 4. Tampering attempt: combined query parameters ?department_id=1&team_id=999
            res_comb = self.client.get("/api/v1/workforce/attendance/stats?department_id=1&team_id=999", headers=headers)
            self.assertEqual(res_comb.status_code, 200)
            comb_data = res_comb.get_json()["data"]
            self.assertEqual(comb_data.get("total_assigned", 0), 0)

            # 5. Organization structure leak test -> should only contain dept 1, sect 102, team 1004
            res_struct = self.client.get("/api/v1/workforce/employees/structure", headers=headers)
            self.assertEqual(res_struct.status_code, 200)
            struct_data = res_struct.get_json()
            self.assertEqual(len(struct_data), 1)
            self.assertEqual(struct_data[0]["id"], 1)
            self.assertEqual(len(struct_data[0]["sections"]), 1)
            self.assertEqual(struct_data[0]["sections"][0]["id"], 102)
            self.assertEqual(len(struct_data[0]["sections"][0]["teams"]), 1)
            self.assertEqual(struct_data[0]["sections"][0]["teams"][0]["id"], 1004)

            # 6. Comparison tree leak test -> comparison stats must only contain team 1004
            res_comp = self.client.get("/api/v1/workforce/attendance/stats/comparison", headers=headers)
            self.assertEqual(res_comp.status_code, 200)
            comp_data = res_comp.get_json()["data"]
            # Depts returned in comparison tree must be only dept 1, sect 102, team 1004
            tree = comp_data.get("tree", {})
            self.assertEqual(len(tree.get("departments", [])), 1)
            self.assertEqual(tree["departments"][0]["id"], 1)
            self.assertEqual(len(tree["departments"][0]["sections"]), 1)
            self.assertEqual(tree["departments"][0]["sections"][0]["id"], 102)
            self.assertEqual(len(tree["departments"][0]["sections"][0]["teams"]), 1)
            self.assertEqual(tree["departments"][0]["sections"][0]["teams"][0]["id"], 1004)

if __name__ == "__main__":
    unittest.main()
