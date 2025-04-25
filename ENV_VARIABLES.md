# Environment Variables

This document lists all environment variables used by the application.

## Required Variables

These variables are required for the application to function properly:

### Supabase Configuration

- `SUPABASE_URL`: The URL of your Supabase instance
- `SUPABASE_ANON_KEY`: The anonymous key for your Supabase instance
- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase instance (client-side)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous key for your Supabase instance (client-side)

### Storage Configuration

- `BLOB_READ_WRITE_TOKEN`: The token for Vercel Blob storage

## Optional Variables

These variables are optional but recommended:

### Database Configuration

- `POSTGRES_URL`: The URL of your Postgres database
- `POSTGRES_PRISMA_URL`: The URL of your Postgres database for Prisma
- `POSTGRES_URL_NON_POOLING`: The non-pooling URL of your Postgres database
- `POSTGRES_USER`: The username for your Postgres database
- `POSTGRES_PASSWORD`: The password for your Postgres database
- `POSTGRES_HOST`: The host of your Postgres database
- `POSTGRES_DATABASE`: The name of your Postgres database

### Supabase Admin

- `SUPABASE_SERVICE_ROLE_KEY`: The service role key for your Supabase instance (for admin operations)

### Site Configuration

- `SITE_URL`: The URL of your site
- `NEXT_PUBLIC_SITE_URL`: The URL of your site (client-side)

### Environment

- `NEXT_PUBLIC_VERCEL_ENV`: The current Vercel environment (development, preview, production)

## Setting Up Environment Variables

### Local Development

Create a `.env.local` file in the root of your project with the following content:

\`\`\`
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Storage
BLOB_READ_WRITE_TOKEN=your_blob_token

# Site
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### Vercel Deployment

Add the environment variables in your Vercel project settings.
\`\`\`

Finally, let's create a script to check environment variables during development:
