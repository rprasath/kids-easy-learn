# Cloudflare Pages Deployment

This app is configured as a pure static Next.js export for Cloudflare Pages.

## What changed

- `next.config.ts` uses `output: "export"` so `next build` writes static assets to `out/`.
- `trailingSlash: true` is enabled so exported routes work cleanly as folder-based static pages.
- Route query parsing for `/learn`, `/quiz`, and `/results` happens in client components, so there is no request-time server rendering.
- Skill content packs are bundled through a generated index instead of runtime filesystem reads.

## Local verification

1. Install dependencies.
2. Run `npm run build`.
3. Confirm the exported site exists in `out/`.

## Cloudflare Pages settings

Use these settings when you create the project:

- Framework preset: `Next.js (Static HTML Export)`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `out`

No environment variables are required for this app right now.

## Deploy with Git integration

1. Push this repository to GitHub.
2. In Cloudflare, open `Workers & Pages`.
3. Select `Create application`.
4. Choose `Pages`.
5. Choose `Import an existing Git repository`.
6. Select this repository.
7. In build settings, choose `Next.js (Static HTML Export)`.
8. Replace the default build command with `npm run build`.
9. Keep the output directory as `out`.
10. Start the deployment.

## Add the custom domain

1. Open the Pages project after the first deploy finishes.
2. Go to `Custom domains`.
3. Add `kidslearn.zybezone.com`.
4. Follow Cloudflare's DNS prompts to attach the hostname.

## Content updates

- Update `data/skills/skills.json` for skill metadata.
- Add or update content JSON files under `data/skills/...`.
- Run `npm run build:data` if you want to regenerate the static content index before a full build.
- Deploy again so Cloudflare publishes the new static export.
