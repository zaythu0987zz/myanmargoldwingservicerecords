# Goldwing Service Record App - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- MySQL 5.7+ or compatible database
- npm or pnpm package manager
- Git for version control

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd goldwing-service-app
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DATABASE_URL=mysql://username:password@localhost:3306/goldwing_db

# JWT Secret (change this to a secure random string in production)
JWT_SECRET=your-secret-key-change-in-production

# Server Port
PORT=3000

# Node Environment
NODE_ENV=production
```

### 4. Database Setup

#### Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE goldwing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Run Migrations

```bash
npm run db:generate
npm run db:migrate
```

Or manually execute the migration SQL files in `drizzle/migrations/`.

## Development Deployment

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

This creates optimized production bundles in the `dist/` directory.

## Production Deployment

### Option 1: Self-Hosted (Linux/Ubuntu Server)

#### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
git clone <repository-url> /var/www/goldwing-app
cd /var/www/goldwing-app

# Install dependencies
npm install --production

# Build application
npm run build

# Create .env file with production values
nano .env
```

#### 3. Start with PM2

```bash
# Start application
pm2 start npm --name "goldwing-app" -- start

# Save PM2 configuration
pm2 save

# Enable PM2 startup on reboot
pm2 startup
```

#### 4. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/goldwing-app
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/goldwing-app /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 5. Enable HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t goldwing-app .
docker run -p 3000:3000 --env-file .env goldwing-app
```

### Option 3: Cloud Platform Deployment

#### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create app
heroku create goldwing-app

# Set environment variables
heroku config:set DATABASE_URL=mysql://...
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git push heroku main
```

#### Railway, Render, or Vercel

Follow platform-specific deployment guides and connect your Git repository for automatic deployments.

## Database Backup & Recovery

### Backup Database

```bash
mysqldump -u username -p goldwing_db > backup.sql
```

### Restore Database

```bash
mysql -u username -p goldwing_db < backup.sql
```

## Monitoring & Maintenance

### Check Application Logs

```bash
# PM2 logs
pm2 logs goldwing-app

# System logs
journalctl -u goldwing-app -f
```

### Monitor Performance

```bash
# Check CPU and memory usage
pm2 monit

# Check database connections
mysql -u root -p -e "SHOW PROCESSLIST;"
```

### Database Maintenance

```bash
# Optimize tables
mysql -u root -p -e "OPTIMIZE TABLE goldwing_db.*;"

# Check table status
mysql -u root -p -e "SHOW TABLE STATUS FROM goldwing_db;"
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable database user authentication
- [ ] Keep dependencies updated
- [ ] Monitor application logs
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure rate limiting
- [ ] Enable CORS properly for production domain

## Troubleshooting

### Database Connection Error

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u username -p -h localhost
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Support

For issues or questions, contact the development team or refer to the main README.md for more information.

---

**Made with ZLP** ✨
