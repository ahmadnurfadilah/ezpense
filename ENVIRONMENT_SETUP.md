# Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration (for receipt processing)
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings > API
4. Copy the Project URL and anon/public key
5. For service role key, go to Settings > API and copy the service_role key (keep this secret!)

## Setting up Anonymous Authentication

1. In your Supabase project dashboard, go to Authentication > Settings
2. Enable "Anonymous sign-ins" in the Auth Providers section
3. Configure rate limits and abuse prevention as needed

## Running Migrations

1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Run migrations: `supabase db push`

## Storage Bucket Setup

The migrations will automatically create a `receipt-images` bucket with proper security policies. The bucket is configured to:
- Allow only authenticated users to upload
- Restrict file types to images and PDFs
- Limit file size to 10MB
- Organize files by user ID for security
