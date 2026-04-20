# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/page-clone-vip`: React/Vite web artifact at `/` that recreates the Progressiva Vegetal Havana landing page from the user's provided source URL. The published source bundle, stylesheet, favicon, and visual assets are stored locally under `public/assets` and `public/images`; extraction references are under `clone-data`. The results video section uses a native `<video>` tag pointed to a local MP4 at `public/videos/progressiva-resultado.mp4`, avoiding YouTube embeds and Google Drive streaming at visit time. Meta Pixel is configured with browser PageView and InitiateCheckout events, plus server-side Conversion API routes for PageView and InitiateCheckout using `META_CAPI_ACCESS_TOKEN`.

## External Deployment

- Root `vercel.json` is configured for deploying the page artifact to Vercel from the full repository: install with pnpm, build `@workspace/page-clone-vip`, and serve `artifacts/page-clone-vip/dist/public`.
- Root `api/meta/page-view.js` and `api/meta/initiate-checkout.js` provide Vercel serverless equivalents for the Meta Conversion API routes used by the landing page.
- Vercel must define `META_CAPI_ACCESS_TOKEN` as an environment variable/secret. `META_PIXEL_ID` is optional because the code defaults to `1977031942900826`.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
