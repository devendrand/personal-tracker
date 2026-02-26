# Quickstart: Verify Dev Auth Fix

Use this guide to verify the fix is working correctly after implementation.

## Prerequisites

- Docker running (`docker compose up --build`)
- App accessible at http://localhost:4200

---

## Test 1: Fresh Load — No 401s

1. Open http://localhost:4200 in a new browser tab (or clear localStorage first via DevTools → Application → Local Storage → Clear All)
2. Open DevTools → Network tab, filter by `XHR/Fetch`
3. Navigate to the Transactions page

**Expected**: All API requests return `200 OK`. No `401` status codes appear.

---

## Test 2: Token Expiry Resilience

1. Open DevTools → Application → Local Storage
2. Find the `access_token` key and manually edit the value to an expired JWT, OR wait 30+ minutes after first load
3. Navigate away and back (or refresh)

**Expected**: The app automatically fetches a fresh token and all data loads without 401 errors.

**Quick way to simulate an expired token**:
Open the browser console and run:
```js
// Build a fake expired token (exp = 1 second after Unix epoch)
const header = btoa(JSON.stringify({alg:'HS256',typ:'JWT'}));
const payload = btoa(JSON.stringify({sub:'dev_user',dev:true,exp:1}));
localStorage.setItem('access_token', `${header}.${payload}.fakesig`);
```
Then navigate to any page — the app should clear the bad token and fetch a fresh one.

---

## Test 3: Backend Token Freshness

Each call to `/api/auth/dev-token` must return a token with a different `exp`:

```bash
TOKEN1=$(curl -s http://localhost:8000/api/auth/dev-token | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
sleep 2
TOKEN2=$(curl -s http://localhost:8000/api/auth/dev-token | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Decode exp from each token (middle segment is base64-encoded payload)
echo $TOKEN1 | cut -d. -f2 | base64 -d 2>/dev/null | python3 -c "import sys,json; p=json.load(sys.stdin); print('Token1 exp:', p['exp'])"
echo $TOKEN2 | cut -d. -f2 | base64 -d 2>/dev/null | python3 -c "import sys,json; p=json.load(sys.stdin); print('Token2 exp:', p['exp'])"
```

**Expected**: `Token2 exp` is greater than `Token1 exp` (approximately 2 seconds later).

---

## Test 4: Automated Tests Pass

```bash
# Backend
cd api && uv run pytest tests/test_auth.py -v

# Frontend (requires Node)
cd web && npx ng test --include='**/dev-token-bootstrap.service.spec.ts' --watch=false
```

**Expected**: All tests pass.
