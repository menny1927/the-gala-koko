# London Annual ProAm

Static Astro website for The Gala at KOKO Theatre.

## Requirements

- Node.js 22.12 or newer
- npm

## Local development

```sh
npm install
cp .env.example .env
npm run dev
```

## Quality checks

```sh
npm run verify
npm run audit:prod
```

## Production

```sh
npm ci
npm run build
```

Deploy the generated `dist/` directory to a static host.

Set `PUBLIC_SITE_URL` to the final HTTPS origin so canonical and social URLs are absolute. Set
`PUBLIC_CONTACT_EMAIL` to the inbox that should receive invitation requests. Requests are prepared
in the visitor's email application; this project does not require a form backend.

High-resolution source photography is retained locally under the ignored `source-assets/`
directory. Web-optimized copies are served from `public/`.
