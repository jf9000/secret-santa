# Family Secret Santa

Static React site (GitHub Pages) + one tiny Cloudflare Worker that stores the lists and keeps the draw secret.

- Everyone enters the **family password**, picks their name, and edits lists (anyone's, honor system).
- Entering the **admin password** on the same screen reveals an **Admin** button. It draws names server-side
  (nobody gets themselves) and shows only `person → private link`. The link tells that person who they got
  and shows the recipient's current list. The admin never sees who got whom.

## Setup

```bash
npm install
npx wrangler login
npx wrangler kv namespace create SANTA     # paste the printed id into wrangler.toml
# edit NAMES in wrangler.toml, then:
npx wrangler secret put FAMILY_PASSWORD    # e.g. a GUID
npx wrangler secret put ADMIN_PASSWORD     # a different GUID
npm run worker:deploy                      # prints the worker URL
```

Frontend: set the repo variable `VITE_API_URL` to the worker URL, enable Pages (source: GitHub Actions), push to `main`.

Local dev: put `FAMILY_PASSWORD=x` and `ADMIN_PASSWORD=y` in `.dev.vars`, run `npm run worker:dev` and `npm run dev`.

## Layout

| Path | What it does |
| --- | --- |
| `worker/index.ts` | API: login, lists, admin draw/links, gift lookup by token |
| `worker/draw.ts` | Random no-self pairing and token generation (tested) |
| `src/screens/` | Lists, Admin, Gift (hash route `#/gift/<token>`) |
