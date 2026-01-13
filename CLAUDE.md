# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Payload CMS Website Template** - a full-stack Next.js application with an enterprise-grade headless CMS. The project combines a Payload admin panel with a production-ready frontend website, all running in a single Next.js instance.

**Stack:**
- Next.js 15 (App Router)
- Payload CMS 3.70
- TypeScript
- PostgreSQL (via Vercel Postgres adapter)
- Vercel Blob Storage for media
- TailwindCSS + shadcn/ui
- Vitest (integration tests) + Playwright (e2e tests)

## Commands

### Development
```bash
pnpm dev                    # Start dev server (http://localhost:3000)
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm dev:prod               # Clean build and start production locally
```

### Database & Types
```bash
pnpm payload migrate:create # Create new migration (required for Postgres schema changes)
pnpm payload migrate        # Run pending migrations (run before production deploy)
pnpm generate:types         # Generate TypeScript types from Payload config
pnpm generate:importmap     # Regenerate component import map
```

### Code Quality
```bash
pnpm lint                   # Run ESLint
pnpm lint:fix               # Fix ESLint errors
tsc --noEmit                # Validate TypeScript without emitting files
```

### Testing
```bash
pnpm test                   # Run all tests (integration + e2e)
pnpm test:int               # Run Vitest integration tests (tests/int/**/*.int.spec.ts)
pnpm test:e2e               # Run Playwright e2e tests (tests/e2e/**/*.e2e.spec.ts)
```

### Database Seeding
Visit `/admin` and click "Seed database" to populate with demo content. **Warning:** This is destructive and will drop existing data.

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── (frontend)/         # Public-facing website routes
│   │   ├── [slug]/         # Dynamic page routes
│   │   ├── posts/          # Blog listing and post pages
│   │   ├── search/         # Search functionality
│   │   └── layout.tsx      # Frontend layout with Header/Footer
│   └── (payload)/          # Payload admin panel routes (auto-generated)
├── collections/            # Payload collection configs (Pages, Posts, Media, etc.)
├── globals/                # Global configs (Header, Footer)
├── blocks/                 # Layout builder blocks (Hero, Content, Media, CTA, Archive)
├── components/             # React components (custom admin + frontend)
├── fields/                 # Reusable field configurations
├── hooks/                  # Payload lifecycle hooks
├── access/                 # Access control functions
├── endpoints/              # Custom API endpoints
├── plugins/                # Plugin configurations (SEO, Search, Redirects, etc.)
├── utilities/              # Helper functions
└── payload.config.ts       # Main Payload configuration
```

### Key Collections

- **Pages**: Layout builder-enabled pages with drafts/versions. Uses blocks for flexible layouts.
- **Posts**: Blog posts with layout builder, categories, authors, and drafts/versions.
- **Media**: Upload collection for images/files with focal point and responsive sizing.
- **Categories**: Nested taxonomy for organizing posts.
- **Users**: Auth-enabled collection with admin panel access.

### Layout Builder System

Pages and Posts use a **block-based layout builder** with these available blocks:
- `Archive`: Displays posts with filtering
- `CallToAction`: CTA section with links
- `Content`: Rich text content (Lexical editor)
- `Hero`: Large hero sections
- `MediaBlock`: Image/video display

All blocks are defined in `src/blocks/` and rendered in the frontend.

## Payload CMS Patterns

### Database Operations (Local API)

When using the Local API in hooks, endpoints, or server components:

```typescript
// ✅ Enforce access control
await payload.find({
  collection: 'posts',
  user: req.user,
  overrideAccess: false,  // REQUIRED when passing user
})

// ✅ Administrative operation (bypasses access control)
await payload.find({
  collection: 'posts',
  // No user parameter = admin privileges
})

// ✅ In hooks: always pass req for transaction safety
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req,  // Maintains atomicity
      })
    },
  ],
}
```

### Migrations (PostgreSQL)

This project uses Vercel Postgres, which requires migrations for schema changes:

1. **After modifying collections/fields**, create a migration:
   ```bash
   pnpm payload migrate:create
   ```

2. **Before deploying**, run migrations:
   ```bash
   pnpm payload migrate
   ```

3. Migrations are stored in `src/migrations/` and tracked in the database.

**Note:** Local development has `push: true` enabled, auto-syncing schema changes without migrations. Production should use migrations.

### Type Generation

After changing Payload config (collections, fields, etc.):

```bash
pnpm generate:types
```

This updates `src/payload-types.ts` with TypeScript types for all collections.

### Custom Components

Components are defined using **file paths** in config:

```typescript
admin: {
  components: {
    beforeLogin: ['@/components/BeforeLogin'],
    // Named export: use #ExportName
    Nav: '@/components/CustomNav#Navigation',
  },
}
```

After adding/modifying components, regenerate the import map:
```bash
pnpm generate:importmap
```

## Frontend Integration

### Server Components (Default)

Pages and layouts are React Server Components that can directly query Payload:

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function Page() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
  })

  return <div>{/* render posts */}</div>
}
```

### Draft Preview & Live Preview

- Draft previews available at `/next/preview?slug=/path&collection=pages`
- Live preview enabled in admin panel with responsive breakpoints (Mobile/Tablet/Desktop)
- Uses Next.js Draft Mode for secure preview access

### Revalidation

Collections use `afterChange` hooks to trigger Next.js revalidation when content is published. See `src/hooks/revalidatePage.ts` and `src/hooks/revalidatePost.ts`.

## Environment Variables

Required variables (see `.env.example`):

```
POSTGRES_URL=postgresql://...          # Database connection
PAYLOAD_SECRET=...                     # JWT encryption
NEXT_PUBLIC_SERVER_URL=http://...      # Base URL (no trailing slash)
CRON_SECRET=...                        # Cron job authentication
PREVIEW_SECRET=...                     # Draft preview security
BLOB_READ_WRITE_TOKEN=...              # Vercel Blob Storage (production)
```

## Important Context Files

The `.cursor/rules/` directory contains detailed Payload CMS guides from the official documentation. Key files:

- **`payload-overview.md`**: Core concepts and architecture
- **`collections.md`**: Collection patterns
- **`fields.md`**: Field types and validation
- **`access-control.md`**: Permission patterns
- **`hooks.md`**: Lifecycle hooks
- **`queries.md`**: Database operations
- **`components.md`**: Custom admin components
- **`endpoints.md`**: Custom API endpoints

Refer to `AGENTS.md` for comprehensive Payload CMS development rules including security patterns, transaction safety, and access control.

## Deployment Notes

### Vercel Deployment

1. Deploy uses `pnpm run ci` which runs `payload migrate && pnpm build`
2. Ensure all environment variables are set in Vercel
3. Connect Neon (Postgres) and Vercel Blob Storage integrations
4. Cron jobs require `CRON_SECRET` in Authorization header

### Post-Deployment

1. Visit `/admin` to create first admin user
2. Optionally seed database with demo content
3. Configure Header/Footer globals
4. Create your first pages and posts
