# API Contract: GET /api/auth/dev-token

**Status**: Changed (was returning static token; now returns fresh token per call)
**Environment**: Development only — endpoint MUST NOT be reachable in production

---

## Request

```
GET /api/auth/dev-token
```

No authentication required. No request body or query parameters.

---

## Response

**200 OK**

```json
{
  "access_token": "<signed JWT string>",
  "token_type": "bearer"
}
```

### Token Payload (decoded)

| Claim | Type   | Value         | Notes                                  |
|-------|--------|---------------|----------------------------------------|
| `sub` | string | `"dev_user"`  | Fixed dev identity                     |
| `dev` | bool   | `true`        | Marker flag for dev tokens             |
| `exp` | int    | now + 30 min  | Freshly computed on every call         |

---

## Behaviour Contract

- **Each call returns a newly minted token** with `exp = now + ACCESS_TOKEN_EXPIRE_MINUTES`.
- **No caching** of the token at the server side — every HTTP request produces a unique token.
- **Consecutive calls** will return tokens with different `exp` values (monotonically increasing).

---

## Change from Previous Behaviour

| | Before | After |
|-|--------|-------|
| Token generation | Once at backend startup (`security.py` module load) | Once per HTTP request |
| Token expiry | Fixed to startup time + 30 min | Fixed to request time + 30 min |
| Token reuse | Same value returned for all callers | Unique value per call |
