# Required Environment Variables

Make sure your `.env.local` file includes these variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL=your-database-url-here
DIRECT_URL=your-direct-database-url-here
```

## Notes:
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET: Get these from Google Cloud Console
- NEXTAUTH_SECRET: Generate with `openssl rand -base64 32`
- DATABASE_URL: Your PostgreSQL connection string (pooled connection)
- DIRECT_URL: Direct database connection for migrations