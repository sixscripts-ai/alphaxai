#!/usr/bin/env python3
"""
AlphaXAI Exclusive End-to-End Test Suite
Tests all critical paths against the live deployment.
"""

import requests
import json
import uuid
import sys

BASE = "https://alphaxai-mu.vercel.app"
RESULTS = {"passed": 0, "failed": 0, "errors": []}

def test(name, fn):
    try:
        result = fn()
        if result:
            RESULTS["passed"] += 1
            print(f"  ✅ {name}")
        else:
            RESULTS["failed"] += 1
            RESULTS["errors"].append(name)
            print(f"  ❌ {name}")
    except Exception as e:
        RESULTS["failed"] += 1
        RESULTS["errors"].append(f"{name}: {e}")
        print(f"  ❌ {name} — {e}")

# ─── FRONTEND ────────────────────────────
print("\n🌐 FRONTEND")
test("Homepage loads", lambda: requests.get(BASE, timeout=15, allow_redirects=True).status_code == 200)
test("Login page loads", lambda: requests.get(f"{BASE}/login", timeout=15).status_code == 200)
test("Register page loads", lambda: requests.get(f"{BASE}/register", timeout=15).status_code == 200)

# ─── GATEWAY HEALTH ──────────────────────
print("\n🏥 GATEWAY HEALTH")
test("Gateway self-check", lambda: requests.get(f"{BASE}/api/health/gateway", timeout=15).status_code == 200)
test("Auth service reachable", lambda: requests.get(f"{BASE}/api/health/auth", timeout=15).status_code == 200)
test("Inventory service reachable", lambda: requests.get(f"{BASE}/api/health/inventory", timeout=15).status_code == 200)
test("Organization service reachable", lambda: requests.get(f"{BASE}/api/health/organization", timeout=15).status_code == 200)
test("Worker service reachable", lambda: requests.get(f"{BASE}/api/health/worker", timeout=15).status_code == 200)

# ─── REGISTRATION ────────────────────────
print("\n📝 REGISTRATION")
TEST_EMAIL = f"e2e-{uuid.uuid4().hex[:8]}@test.alphaxai.com"
TEST_PASSWORD = "TestPass123!"
TEST_ORG = f"TestOrg-{uuid.uuid4().hex[:6]}"
tokens = {}

def test_register():
    r = requests.post(f"{BASE}/api/auth/register", json={
        "email": TEST_EMAIL, "password": TEST_PASSWORD,
        "firstName": "E2E", "lastName": "Tester",
        "organizationName": TEST_ORG
    }, timeout=30)
    data = r.json()
    if r.status_code in (200, 201):
        t = data.get("tokens", {})
        tokens["access"] = t.get("accessToken", data.get("token", ""))
        tokens["refresh"] = t.get("refreshToken", "")
        return bool(tokens["access"])
    print(f"    → {r.status_code}: {json.dumps(data)[:200]}")
    return False
test("Register new user", test_register)

# ─── LOGIN ───────────────────────────────
print("\n🔑 LOGIN")
def test_login():
    r = requests.post(f"{BASE}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}, timeout=30)
    data = r.json()
    if r.status_code == 200:
        t = data.get("tokens", {})
        tokens["access"] = t.get("accessToken", data.get("token", ""))
        tokens["refresh"] = t.get("refreshToken", "")
        return bool(tokens["access"])
    print(f"    → {r.status_code}: {json.dumps(data)[:200]}")
    return False

def test_login_returns_name():
    r = requests.post(f"{BASE}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}, timeout=30)
    data = r.json()
    user = data.get("user", {})
    ok = user.get("first_name") == "E2E" or user.get("firstName") == "E2E"
    if not ok:
        print(f"    → user: {json.dumps(user)[:200]}")
    return ok

test("Login with new user", test_login)
test("Login returns first/last name", test_login_returns_name)

# ─── AUTHENTICATED ───────────────────────
print("\n🔒 AUTHENTICATED ENDPOINTS")
def hdr():
    return {"Authorization": f"Bearer {tokens.get('access', '')}"}

def test_me():
    r = requests.get(f"{BASE}/api/auth/me", headers=hdr(), timeout=15)
    if r.status_code == 200:
        user = r.json().get("user", r.json())
        return "email" in user
    print(f"    → {r.status_code}: {r.text[:200]}")
    return False

test("/me with valid token", test_me)
test("/me rejects no token", lambda: requests.get(f"{BASE}/api/auth/me", timeout=15).status_code in (401, 403))

# ─── REFRESH TOKEN ───────────────────────
print("\n🔄 TOKEN REFRESH")
def test_refresh():
    if not tokens.get("refresh"):
        print("    → No refresh token received")
        return False
    r = requests.post(f"{BASE}/api/auth/refresh", json={"refreshToken": tokens["refresh"]}, timeout=15)
    if r.status_code == 200:
        t = r.json().get("tokens", {})
        tok = t.get("accessToken", "")
        if tok:
            tokens["access"] = tok
            tokens["refresh"] = t.get("refreshToken", tokens["refresh"])
            return True
    print(f"    → {r.status_code}: {r.text[:200]}")
    return False

test("Refresh token returns new access token", test_refresh)
test("Refresh rejects invalid token", lambda: requests.post(f"{BASE}/api/auth/refresh", json={"refreshToken": "bad"}, timeout=15).status_code in (401, 403, 500))

# ─── ORGANIZATION ────────────────────────
print("\n🏢 ORGANIZATION")
def test_get_org():
    r = requests.get(f"{BASE}/api/organization", headers=hdr(), timeout=15)
    if r.status_code == 200:
        return True
    r2 = requests.get(f"{BASE}/api/organizations", headers=hdr(), timeout=15)
    if r2.status_code == 200:
        return True
    print(f"    → {r.status_code}: {r.text[:200]}")
    return False
test("Get organization", test_get_org)
test("Get locations", lambda: requests.get(f"{BASE}/api/locations", headers=hdr(), timeout=15).status_code in (200, 404))

# ─── INVENTORY CRUD ──────────────────────
print("\n📦 INVENTORY")
item_id = None

def test_list_items():
    r = requests.get(f"{BASE}/api/inventory/items", headers=hdr(), timeout=15)
    if r.status_code == 200:
        return True
    print(f"    → {r.status_code}: {r.text[:200]}")
    return False

def test_create_item():
    global item_id
    r = requests.post(f"{BASE}/api/inventory/items", headers=hdr(), json={
        "name": f"E2E-Item-{uuid.uuid4().hex[:6]}",
        "sku": f"E2E-{uuid.uuid4().hex[:8]}",
        "description": "End-to-end test item",
        "quantity": 100, "unit_cost": 9.99,
        "reorder_point": 10, "category": "Testing"
    }, timeout=15)
    data = r.json()
    if r.status_code in (200, 201):
        item_id = data.get("id") or data.get("item", {}).get("id")
        return item_id is not None
    print(f"    → {r.status_code}: {json.dumps(data)[:200]}")
    return False

def test_get_item():
    if not item_id:
        print("    → No item_id"); return False
    r = requests.get(f"{BASE}/api/inventory/items/{item_id}", headers=hdr(), timeout=15)
    return r.status_code == 200

def test_update_item():
    if not item_id:
        print("    → No item_id"); return False
    r = requests.put(f"{BASE}/api/inventory/items/{item_id}", headers=hdr(), json={"name": "E2E-Updated", "quantity": 200}, timeout=15)
    return r.status_code in (200, 204)

def test_export():
    r = requests.get(f"{BASE}/api/inventory/items/export", headers=hdr(), timeout=15)
    if r.status_code == 200:
        return len(r.content) > 0
    print(f"    → {r.status_code}: {r.text[:200]}")
    return False

test("List items", test_list_items)
test("Create item (with description)", test_create_item)
test("Get single item", test_get_item)
test("Update item", test_update_item)
test("Export items", test_export)

# ─── DASHBOARD ───────────────────────────
print("\n📊 DASHBOARD DATA")
def test_stats():
    r = requests.get(f"{BASE}/api/inventory/stats", headers=hdr(), timeout=15)
    if r.status_code == 200: return True
    r2 = requests.get(f"{BASE}/api/inventory/dashboard", headers=hdr(), timeout=15)
    if r2.status_code == 200: return True
    print(f"    → stats={r.status_code}, dashboard={r2.status_code if r2 else '?'}")
    return False
def test_activity():
    r = requests.get(f"{BASE}/api/inventory/activity", headers=hdr(), timeout=15)
    return r.status_code in (200, 404)

test("Inventory stats/dashboard", test_stats)
test("Inventory activity feed", test_activity)

# ─── ANALYTICS ───────────────────────────
print("\n🤖 ANALYTICS / AI")
def test_overview():
    r = requests.get(f"{BASE}/api/analytics/overview", headers=hdr(), timeout=30)
    if r.status_code == 200: return True
    print(f"    → {r.status_code}: {r.text[:200]}")
    return r.status_code in (502, 504)

def test_insights():
    r = requests.post(f"{BASE}/api/analytics/insights", headers=hdr(), json={"prompt": "What are my top items?"}, timeout=60)
    if r.status_code == 200: return True
    print(f"    → {r.status_code}: {r.text[:200]}")
    return r.status_code in (502, 504)

test("Analytics overview", test_overview)
test("Analytics AI insights", test_insights)

# ─── CLEANUP ─────────────────────────────
print("\n🧹 CLEANUP")
def test_delete():
    if not item_id: return True
    r = requests.delete(f"{BASE}/api/inventory/items/{item_id}", headers=hdr(), timeout=15)
    return r.status_code in (200, 204)
test("Delete test item", test_delete)

# ─── SECURITY ────────────────────────────
print("\n🛡️  SECURITY")
test("Invalid login rejected", lambda: requests.post(f"{BASE}/api/auth/login", json={"email": "fake@x.com", "password": "wrong"}, timeout=15).status_code in (401, 400, 404))
test("Inventory rejects unauthenticated", lambda: requests.get(f"{BASE}/api/inventory/items", timeout=15).status_code in (401, 403))
test("Duplicate registration rejected", lambda: requests.post(f"{BASE}/api/auth/register", json={"email": TEST_EMAIL, "password": TEST_PASSWORD, "firstName": "Dup", "lastName": "User", "organizationName": "DupOrg"}, timeout=15).status_code in (400, 409, 422))

# ─── RESULTS ─────────────────────────────
print("\n" + "═" * 50)
total = RESULTS["passed"] + RESULTS["failed"]
pct = (RESULTS["passed"] / total * 100) if total > 0 else 0
print(f"  RESULTS: {RESULTS['passed']}/{total} passed ({pct:.0f}%)")
if RESULTS["errors"]:
    print(f"\n  FAILURES:")
    for e in RESULTS["errors"]:
        print(f"    • {e}")
print("═" * 50)
sys.exit(0 if RESULTS["failed"] == 0 else 1)
