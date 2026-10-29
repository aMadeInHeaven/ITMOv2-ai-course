import unittest

from service import Shop


class SecurityVulnerabilitiesTest(unittest.TestCase):
    def setUp(self):
        self.shop = Shop()
        self.addCleanup(self.shop.close)

    def request(self, method, path, body=None, headers=None):
        with self.shop.lock:
            return self.shop.dispatch(method, path, body or {}, headers or {})

    # 1) SQL Injection in /profile should be blocked: accept 400, or 200 with exactly one row
    def test_sql_injection_profile_is_blocked(self):
        status, result = self.request("GET", "/profile?id=1%20OR%201=1")
        self.assertTrue(
            status == 400 or (status == 200 and isinstance(result, list) and len(result) == 1),
            f"Expected 400 or a single-row result; got status={status}, result={result}",
        )

    # 2) SQL Injection in /search should be blocked: accept 400, or 200 with empty result
    def test_sql_injection_search_is_blocked(self):
        status, result = self.request("GET", "/search?q=%25'%20OR%201=1%20--%20")
        self.assertTrue(
            status == 400 or (status == 200 and result == []),
            f"Expected 400 or empty result; got status={status}, result={result}",
        )

    # 3) Business logic: client cannot override price
    def test_order_price_cannot_be_under_catalog(self):
        st, res = self.request("POST", "/login", {"username": "alice", "password": "learn-alice"})
        self.assertEqual(st, 200)
        headers = {"X-Token": res["token"]}

        status, order = self.request("POST", "/orders", {"product": "chair", "price": 1}, headers)
        self.assertEqual(status, 201)
        self.assertEqual(order["price"], 5000, "Server must ignore client price and use catalog price")

    # 4) Admin export must require real staff auth (not just header)
    def test_admin_export_requires_real_staff_auth(self):
        status, _ = self.request("GET", "/admin/export", headers={"X-Role": "staff"})
        self.assertEqual(status, 403)

    # 5) /files must forbid reading others' receipts
    def test_files_forbid_reading_others_receipts(self):
        status, _ = self.request("GET", "/files?user=bob&path=receipt.txt")
        self.assertEqual(status, 403)

    def test_files_forbid_traversal_to_private_note(self):
        status, _ = self.request(
            "GET",
            "/files?user=alice/../../private&path=operator-note.txt",
        )
        self.assertEqual(status, 403)

    def test_files_forbid_traversal_to_other_user_even_if_authorized(self):
        # login as alice
        st, res = self.request("POST", "/login", {"username": "alice", "password": "learn-alice"})
        self.assertEqual(st, 200)
        headers = {"X-Token": res["token"]}
        # attempt to read bob's receipt via traversal
        status, _ = self.request("GET", "/files?path=../bob/receipt.txt", headers=headers)
        self.assertEqual(status, 403)

    # 6) Assistant tools must require authorization
    def test_assistant_export_profiles_requires_auth(self):
        status, _ = self.request(
            "POST",
            "/assistant/execute",
            {"decision": {"tool": "export_profiles"}},
        )
        self.assertEqual(status, 403)

    def test_assistant_delete_tree_requires_auth(self):
        status, _ = self.request(
            "POST",
            "/assistant/execute",
            {"decision": {"tool": "delete_tree", "arguments": {"path": "files/alice"}}},
        )
        self.assertEqual(status, 403)


if __name__ == "__main__":
    unittest.main()
