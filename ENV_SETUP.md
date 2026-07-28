# Environment Variables Configuration

This document describes all environment variables used by the Goldwing Service Record App.

## Required Variables

### Database Configuration

**DATABASE_URL**
- Format: `mysql://username:password@host:port/database`
- Example: `mysql://root:password@localhost:3306/goldwing_db`
- Description: MySQL database connection string

### Authentication

**JWT_SECRET**
- Type: String (random, secure)
- Example: `your-secret-key-change-in-production`
- Description: Secret key used to sign JWT tokens for session management
- Security: Generate with `openssl rand -base64 32` and keep secure

**OWNER_PIN**
- Type: String (numeric)
- Example: `191995`
- Description: PIN code for owner authentication
- Note: Currently set to `191995`

**OWNER_EMAIL**
- Type: Email address
- Example: `zaythu0987@gmail.com`
- Description: Email address of the application owner

### Server Configuration

**PORT**
- Type: Number
- Default: `3000`
- Description: Server port for the application

**NODE_ENV**
- Type: String (`development` | `production`)
- Default: `development`
- Description: Application environment mode

## Optional Variables

### OAuth Configuration

**GOOGLE_CLIENT_ID**
- Type: String
- Description: Google OAuth 2.0 Client ID (for future Gmail OAuth integration)

**GOOGLE_CLIENT_SECRET**
- Type: String
- Description: Google OAuth 2.0 Client Secret (keep secure)

**GOOGLE_CALLBACK_URL**
- Type: URL
- Example: `http://localhost:3000/api/oauth/callback`
- Description: Callback URL for Google OAuth

### Application Settings

**APP_NAME**
- Type: String
- Default: `Goldwing Service Record`
- Description: Application display name

**APP_URL**
- Type: URL
- Example: `http://localhost:3000`
- Description: Base URL of the application

## Setup Instructions

### Development Environment

1. Copy the example configuration:
   ```bash
   cp ENV_SETUP.md .env
   ```

2. Edit `.env` with your local values:
   ```env
   DATABASE_URL=mysql://root:password@localhost:3306/goldwing_db
   JWT_SECRET=dev-secret-key-change-in-production
   PORT=3000
   NODE_ENV=development
   OWNER_EMAIL=zaythu0987@gmail.com
   OWNER_PIN=191995
   ```

3. Create the database:
   ```bash
   mysql -u root -p -e "CREATE DATABASE goldwing_db;"
   ```

4. Run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Production Environment

1. Generate secure JWT_SECRET:
   ```bash
   openssl rand -base64 32
   ```

2. Set environment variables:
   ```bash
   export DATABASE_URL=mysql://prod_user:strong_password@db-host:3306/goldwing_prod
   export JWT_SECRET=<generated-secure-key>
   export NODE_ENV=production
   export PORT=3000
   export OWNER_EMAIL=owner@example.com
   export OWNER_PIN=<secure-pin>
   ```

3. Or create `.env` file in production:
   ```env
   DATABASE_URL=mysql://prod_user:strong_password@db-host:3306/goldwing_prod
   JWT_SECRET=<generated-secure-key>
   NODE_ENV=production
   PORT=3000
   OWNER_EMAIL=owner@example.com
   OWNER_PIN=<secure-pin>
   ```

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong JWT_SECRET** - Generate with `openssl rand -base64 32`
3. **Rotate secrets regularly** - Change JWT_SECRET and OWNER_PIN periodically
4. **Use environment variables** - Don't hardcode secrets in code
5. **Restrict file permissions** - Set `.env` to `600` permissions
6. **Use HTTPS in production** - Always use SSL/TLS certificates
7. **Monitor access logs** - Track authentication attempts

## Troubleshooting

### Database Connection Failed

- Verify DATABASE_URL format is correct
- Check MySQL server is running
- Verify database user has correct permissions
- Test connection: `mysql -u username -p -h host`

### JWT Errors

- Ensure JWT_SECRET is set and consistent
- Check token hasn't expired
- Verify token format in requests

### Authentication Issues

- Verify OWNER_PIN matches expected value
- Check OWNER_EMAIL is correct
- Review authentication logs

## Support

For issues or questions, refer to the main README.md or DEPLOYMENT_GUIDE.md.

---

**Made with ZLP** ✨
