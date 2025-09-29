# 🚀 Supabase Setup Guide for Ezpense

This guide will help you set up Supabase with anonymous authentication and storage for the Ezpense expense manager.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the CLI tool
   ```bash
   npm install -g supabase
   ```

## 🏗️ Project Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `ezpense`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Project Credentials

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL**
   - **anon/public key**
   - **service_role key** (keep this secret!)

### 3. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration (for receipt processing)
OPENAI_API_KEY=your-openai-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Link Your Project

```bash
# Login to Supabase
supabase login

# Link your project (replace with your project reference)
supabase link --project-ref your-project-ref
```

## 🔐 Enable Anonymous Authentication

1. In your Supabase dashboard, go to **Authentication > Settings**
2. Scroll down to **Auth Providers**
3. Enable **Anonymous sign-ins**
4. Configure rate limits (recommended: 30 requests per hour)
5. Optionally enable **Invisible CAPTCHA** for abuse prevention

## 🗄️ Run Database Migrations

The project includes three migration files that will set up your database:

```bash
# Push all migrations to your database
supabase db push
```

This will create:
- **Tables**: `categories`, `expenses`, `receipts`, `user_preferences`
- **Storage bucket**: `receipt-images` for receipt files
- **RLS policies**: Secure access control for anonymous users
- **Functions**: Helper functions for data management

## 📁 Storage Configuration

The migrations automatically create a `receipt-images` storage bucket with:

- **Privacy**: Private bucket (users can only access their own files)
- **File types**: Images (JPEG, PNG) and PDFs
- **Size limit**: 10MB per file
- **Organization**: Files organized by user ID for security

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow anonymous users to access only their own data
- Prevent cross-user data access
- Support both anonymous and permanent users

### Anonymous User Handling

The app automatically:
- Signs in users anonymously on first visit
- Creates user preferences automatically
- Maintains data isolation between users
- Supports conversion to permanent accounts later

## 🧪 Testing the Setup

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Visit the app**: Go to `http://localhost:3000`

3. **Check authentication**: You should see "Anonymous" status in the navigation

4. **Test features**:
   - Upload a receipt
   - Create an expense
   - View the dashboard

## 🔧 Troubleshooting

### Common Issues

1. **"Invalid API key" error**:
   - Check your `.env.local` file
   - Ensure the Supabase URL and keys are correct

2. **"Anonymous sign-ins not enabled"**:
   - Go to Authentication > Settings in Supabase dashboard
   - Enable anonymous sign-ins

3. **"Storage bucket not found"**:
   - Run `supabase db push` to ensure migrations are applied
   - Check the storage bucket exists in your dashboard

4. **"Permission denied" errors**:
   - Verify RLS policies are applied
   - Check that the user is properly authenticated

### Useful Commands

```bash
# Check Supabase status
supabase status

# View database schema
supabase db diff

# Reset database (⚠️ deletes all data)
supabase db reset

# View logs
supabase logs
```

## 📊 Database Schema

### Tables Created

- **`categories`**: Expense categories with budgets
- **`expenses`**: User expenses with AI-extracted data
- **`receipts`**: Receipt metadata and processing status
- **`user_preferences`**: User settings and preferences

### Key Features

- **UUID primary keys** for security
- **Automatic timestamps** for audit trails
- **JSONB fields** for flexible data storage
- **Foreign key relationships** for data integrity
- **Indexes** for optimal performance

## 🚀 Production Deployment

For production deployment:

1. **Update environment variables** with production URLs
2. **Configure custom domain** in Supabase settings
3. **Set up monitoring** and alerts
4. **Configure backup policies**
5. **Review security settings**

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Anonymous Authentication Guide](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

🎉 **You're all set!** Your Ezpense app now has a fully functional backend with anonymous authentication and secure file storage.
