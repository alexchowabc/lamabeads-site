# Domain And Brand Migration

Use this when the final business name and domain are ready.

## Update App Identity

1. Set the new values in `src/data/brand.js`, or provide them as build env vars:
   - `VITE_BRAND_NAME`
   - `VITE_SITE_URL`
   - `VITE_CONTACT_EMAIL`
   - `VITE_CONTACT_URL`
2. Update `index.html` title and meta description so the first HTML response matches the new name.
3. Update `public/CNAME` only after the new domain DNS is ready.

## DNS / Hosting Order

1. Add the new domain in GitHub Pages.
2. Add the required DNS records at the domain provider.
3. Update `public/CNAME`.
4. Deploy and verify:
   - Home page loads on the new domain.
   - Direct routes such as `/collection/hoa-tai` and `/product/lama-003` render.
   - Canonical, Open Graph, and JSON-LD URLs use the new domain.
5. Keep the old domain active until the new domain is fully verified.

## Current Status

The current live domain remains `lamabeads.com` until the new name/domain is confirmed.
