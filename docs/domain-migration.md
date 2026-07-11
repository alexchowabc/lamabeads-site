# Domain And Brand Migration

Use this for the Châu Ngọc Phúc domain migration.

## Update App Identity

1. Set the new values in `src/data/brand.js`, or provide them as build env vars:
   - `VITE_BRAND_NAME`
   - `VITE_SITE_URL`
   - `VITE_CONTACT_EMAIL`
   - `VITE_CONTACT_URL`
2. Update `index.html` title and meta description so the first HTML response matches the new name.
3. Update `public/CNAME` to the production custom domain.

## DNS / Hosting Order

1. Add the new domain in GitHub Pages.
2. Add the required DNS records at the domain provider.
3. Update `public/CNAME`.
4. Deploy and verify:
   - Home page loads on the new domain.
   - Direct routes such as `/collection/hoa-tai` and `/product/lama-003` render.
   - Canonical, Open Graph, and JSON-LD URLs use the new domain.
5. Keep the old domain active until the new domain is fully verified.

## Squarespace DNS Records

Add these custom records in Squarespace:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `alexchowabc.github.io` |

Do not add wildcard records such as `*`.

## Current Status

Target domain: `chaungocphuc.com`.

GitHub Pages source is prepared for the new domain. Squarespace DNS still needs to point `chaungocphuc.com` to GitHub Pages before the new domain can load.
