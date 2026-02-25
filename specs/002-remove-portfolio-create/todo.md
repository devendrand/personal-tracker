# TODO / Backlog — Remove Portfolio Create Page

**Last updated**: 2026-02-25

## Open Items

- Frontend validation is pending (no host `node`/`npm` required):
	- [x] Frontend build (compile check): `docker build -f web/Dockerfile --target builder -t trade-tracker-web:builder web`
	- [x] Manual UI quickstart: `docker compose up --build -d web` then open `http://localhost:4200/portfolios` and confirm no create workflow/CTA
	- [x] (Optional) Backend regression: `cd api && uv run pytest`
