# Imole AI - Deployment Guide

**Product:** Imole AI  
**Parent Company:** Health Intelligence Labs  
**Description:** AI-powered teleradiology reporting platform

---

## Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Architecture Overview](#architecture-overview)
4. [Local Development Setup](#local-development-setup)
5. [Production Deployment](#production-deployment)
   - [Namecheap Shared Hosting](#option-1-namecheap-shared-hosting)
   - [VPS/Dedicated Server](#option-2-vpsdedicated-server)
   - [Cloud Platforms](#option-3-cloud-platforms)
6. [Backend API Setup](#backend-api-setup)
7. [Database Configuration](#database-configuration)
8. [DICOM Storage Configuration](#dicom-storage-configuration)
9. [Security Considerations](#security-considerations)
10. [Environment Variables](#environment-variables)
11. [Troubleshooting](#troubleshooting)

---

## Overview

Imole AI is a React-based frontend application for teleradiology services. This guide covers deploying the application to various hosting environments.

### What's Included

- React + TypeScript frontend
- DICOM viewer integration
- PDF report generation
- Role-based authentication (Diagnostic Center, Radiologist, Admin)
- Responsive UI with Tailwind CSS

### What You Need to Add (Backend)

- Authentication API (JWT-based)
- Database (PostgreSQL/MySQL)
- DICOM storage (AWS S3 / Google Cloud Storage)
- Real DICOM parsing server
- Email/WhatsApp notification service

---

## System Requirements

### Minimum Requirements

- **Node.js:** 18.x or higher
- **npm:** 9.x or higher
- **Git:** 2.x or higher
- **Storage:** 500MB for frontend build

### For Full Production

- **Server:** 2 vCPU, 4GB RAM minimum
- **Storage:** 100GB+ for DICOM files
- **Database:** PostgreSQL 14+ or MySQL 8+
- **SSL Certificate:** Required for HIPAA compliance

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Client Browser │────▶│  React Frontend │────▶│   Backend API   │
│                 │     │   (Imole AI)  │     │  (Node/Python)  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              ┌─────────────────────────┼─────────────────────────┐
                              │                         │                         │
                              ▼                         ▼                         ▼
                       ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
                       │  PostgreSQL  │        │  DICOM Store │        │  Email/SMS   │
                       │   Database   │        │  (S3/GCS)    │        │   Service    │
                       └──────────────┘        └──────────────┘        └──────────────┘
```

---

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd imole-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 2: Environment Setup

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_DICOM_VIEWER_URL=http://localhost:3002

# Authentication
VITE_JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Storage (for development, use local storage)
VITE_STORAGE_TYPE=local

# Feature Flags
VITE_ENABLE_AI_ASSIST=true
VITE_ENABLE_WHATSAPP_NOTIFICATIONS=false
```

### Step 3: Build for Production

```bash
# Create optimized production build
npm run build

# Output will be in the `dist/` folder
```

---

## Production Deployment

### Option 1: Namecheap Shared Hosting

Namecheap shared hosting can host the **frontend only**. For DICOM storage and backend, you'll need additional services.

#### Step 1: Prepare Build Files

```bash
# Build the application
npm run build

# The `dist/` folder contains all static files
```

#### Step 2: Upload to Namecheap

**Method A: Using cPanel File Manager**

1. Log in to your Namecheap cPanel
2. Navigate to **File Manager**
3. Go to `public_html` (or your subdomain folder)
4. **Delete** existing files (backup first!)
5. Click **Upload** and select all files from your local `dist/` folder
6. Ensure `index.html` is in the root directory

**Method B: Using FTP (FileZilla)**

```bash
# FTP Credentials (from Namecheap)
Host: ftp.yourdomain.com
Username: your_username
Password: your_password
Port: 21

# Upload all files from dist/ to public_html/
```

**Method C: Using Git (if Git deployment is enabled)**

```bash
# Add Namecheap remote
git remote add namecheap https://ftp.yourdomain.com/repository.git

# Push to deploy
git push namecheap main
```

#### Step 3: Configure .htaccess for React Router

Create a `.htaccess` file in `public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

#### Step 4: Enable SSL (HTTPS)

1. In cPanel, go to **SSL/TLS Status**
2. Run **AutoSSL** to generate free Let's Encrypt certificate
3. Force HTTPS by adding to `.htaccess`:

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

### Option 2: VPS/Dedicated Server

For full control and backend deployment.

#### Step 1: Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

#### Step 2: Deploy Frontend

```bash
# Create app directory
sudo mkdir -p /var/www/imole-ai
sudo chown -R $USER:$USER /var/www/imole-ai

# Copy build files
cp -r dist/* /var/www/imole-ai/

# Set permissions
sudo chmod -R 755 /var/www/imole-ai
```

#### Step 3: Configure Nginx

Create `/etc/nginx/sites-available/imole-ai`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/imole-ai;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/imole-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: Enable HTTPS with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is automatically configured
```

---

### Option 3: Cloud Platforms

#### AWS S3 + CloudFront (Static Hosting)

```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure

# Create S3 bucket
aws s3 mb s3://imole-ai-frontend

# Enable static website hosting
aws s3 website s3://imole-ai-frontend --index-document index.html --error-document index.html

# Upload files
aws s3 sync dist/ s3://imole-ai-frontend --delete

# Set bucket policy for public read
aws s3api put-bucket-policy --bucket imole-ai-frontend --policy file://bucket-policy.json
```

**bucket-policy.json:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::imole-ai-frontend/*"
    }
  ]
}
```

#### Vercel (Recommended for React)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

---

## Backend API Setup

The current MVP uses mock data. For production, you need a backend API.

### Recommended Stack

- **Runtime:** Node.js with Express
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT with refresh tokens
- **File Storage:** AWS S3 or Google Cloud Storage

### Sample Backend Structure

```
imole-api/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── cases.controller.js
│   │   ├── reports.controller.js
│   │   └── dicom.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── upload.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── case.model.js
│   │   └── report.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── cases.routes.js
│   │   └── reports.routes.js
│   ├── services/
│   │   ├── dicom.service.js
│   │   ├── notification.service.js
│   │   └── pdf.service.js
│   └── app.js
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```

### Environment Variables for Backend

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/imole

# JWT
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS S3 (DICOM Storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=imole-dicom-storage

# Email (SendGrid/AWS SES)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@imole.ai

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_WHATSAPP_NUMBER=+1234567890

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

---

## Database Configuration

### PostgreSQL Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  name          String
  role          UserRole
  phone         String?
  organization  String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  cases         Case[]
  reports       Report[]
}

model Case {
  id                    String      @id @default(uuid())
  caseNumber            String      @unique
  patientName           String
  patientAge            Int
  patientGender         String
  patientId             String
  referringPhysician    String?
  scanType              ScanType
  bodyPart              String
  clinicalHistory       String
  urgency               Urgency
  status                CaseStatus  @default(pending)
  turnaroundHours       Float?
  
  diagnosticCenterId    String
  assignedRadiologistId String?
  
  dicomFiles            DicomFile[]
  report                Report?
  
  createdAt             DateTime    @default(now())
  assignedAt            DateTime?
  completedAt           DateTime?
  
  diagnosticCenter      User        @relation(fields: [diagnosticCenterId], references: [id])
}

model Report {
  id                String   @id @default(uuid())
  caseId            String   @unique
  radiologistId     String
  findings          String
  impression        String
  recommendations   String?
  pdfUrl            String?
  signedAt          DateTime?
  createdAt         DateTime @default(now())
  
  case              Case     @relation(fields: [caseId], references: [id])
  radiologist       User     @relation(fields: [radiologistId], references: [id])
}

model DicomFile {
  id                String @id @default(uuid())
  caseId            String
  fileName          String
  fileSize          Int
  s3Key             String
  studyInstanceUid  String?
  seriesInstanceUid String?
  
  case              Case   @relation(fields: [caseId], references: [id])
}

enum UserRole {
  admin
  diagnostic_center
  radiologist
}

enum ScanType {
  xray
  ct
  mri
  ultrasound
}

enum Urgency {
  routine
  urgent
  stat
}

enum CaseStatus {
  pending
  assigned
  in_progress
  completed
  cancelled
}
```

### Database Migration

```bash
# Initialize Prisma
npx prisma init

# Generate migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## DICOM Storage Configuration

### AWS S3 Setup

```bash
# Create S3 bucket
aws s3 mb s3://imole-dicom-storage

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket imole-dicom-storage \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket imole-dicom-storage \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### S3 Upload Policy (Backend)

```javascript
// Generate presigned URL for secure upload
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const generateUploadUrl = async (fileName, contentType) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `uploads/${Date.now()}-${fileName}`,
    ContentType: contentType,
    Expires: 300, // 5 minutes
  };
  
  return await s3.getSignedUrlPromise('putObject', params);
};
```

---

## Security Considerations

### HIPAA Compliance Checklist

- [ ] **Encryption at Rest:** Enable on database and S3
- [ ] **Encryption in Transit:** HTTPS/TLS 1.3 only
- [ ] **Access Controls:** Role-based authentication
- [ ] **Audit Logs:** Log all data access
- [ ] **Backup:** Automated daily backups
- [ ] **Data Retention:** Define retention policies
- [ ] **BAA:** Sign Business Associate Agreement with cloud providers

### Security Headers

Add to Nginx config:

```nginx
# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

### CORS Configuration

```javascript
// Backend CORS
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Environment Variables

### Frontend (.env)

```env
# API Endpoints
VITE_API_URL=https://api.imole.ai/v1
VITE_DICOM_VIEWER_URL=https://viewer.imole.ai

# Feature Flags
VITE_ENABLE_AI_ASSIST=true
VITE_ENABLE_REALTIME_NOTIFICATIONS=true

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Backend (.env)

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/imole

# JWT
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=imole-dicom

# Email
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=reports@imole.ai

# Redis (for sessions/cache)
REDIS_URL=redis://localhost:6379
```

---

## Troubleshooting

### Common Issues

#### 1. 404 on Page Refresh (React Router)

**Solution:** Ensure `.htaccess` or Nginx config has fallback to `index.html`

#### 2. CORS Errors

**Solution:** Configure CORS on backend:

```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

#### 3. DICOM Files Not Loading

**Solution:** Check CORS on S3 bucket:

```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>https://yourdomain.com</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

#### 4. Build Fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit
```

#### 5. SSL Certificate Issues

```bash
# Test SSL
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Renew Certbot
sudo certbot renew --dry-run
```

---

## Maintenance

### Regular Tasks

| Task | Frequency | Command |
|------|-----------|---------|
| Security Updates | Weekly | `sudo apt update && sudo apt upgrade` |
| SSL Renewal | Auto (Certbot) | `sudo certbot renew` |
| Database Backup | Daily | Automated script |
| Log Rotation | Daily | `logrotate` |
| Dependency Updates | Monthly | `npm audit fix` |

### Monitoring

Recommended tools:
- **Uptime:** UptimeRobot, Pingdom
- **Performance:** New Relic, Datadog
- **Errors:** Sentry
- **Logs:** ELK Stack, Splunk

---

## Support

For technical support:
- **Email:** support@healthintelligencelabs.com
- **Documentation:** https://docs.imole.ai
- **GitHub Issues:** https://github.com/healthintelligencelabs/imole-ai/issues

---

**© 2024 Health Intelligence Labs. All rights reserved.**
