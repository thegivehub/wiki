# Configuration Guide

## Overview

This guide covers the configuration options for The Give Hub platform. Proper configuration is essential for optimal performance, security, and integration with external services like the Stellar blockchain network.

## Configuration Files

The Give Hub uses environment variables for configuration, which can be set using:

1. `.env` file in the project root (recommended for development)
2. Docker environment variables (recommended for containerized deployments)
3. System environment variables (alternative for production deployments)

## Core Configuration Categories

### Server Settings

```
# Basic server configuration
PORT=3000                      # API server port
NODE_ENV=production            # Environment (development, test, production)
API_URL=https://api.yourdomain.com  # Public API URL
FRONTEND_URL=https://yourdomain.com # Frontend application URL
```

### Database Configuration

```
# PostgreSQL connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=givehub_db
DB_USER=givehub
DB_PASSWORD=your_secure_password

# Redis configuration (for caching and session management)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

### Authentication & Security

```
# JWT authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=86400                # Token expiry in seconds (24 hours)

# CORS settings
CORS_ORIGIN=https://yourdomain.com

# Rate limiting
RATE_LIMIT_WINDOW=15            # Time window in minutes
RATE_LIMIT_MAX_REQUESTS=100     # Maximum requests per window
```

### Blockchain Integration

```
# Stellar network settings
STELLAR_NETWORK=public          # 'public' for mainnet, 'testnet' for testing
STELLAR_PUBLIC_KEY=G...         # Your Stellar public key
STELLAR_SECRET_KEY=S...         # Your Stellar secret key (keep secure!)

# Asset configuration
STELLAR_ASSET_CODE=GIVE         # Custom asset code, if using
STELLAR_ASSET_ISSUER=G...       # Asset issuer, if using custom asset
```

### Email Configuration

```
# SMTP settings for sending emails
SMTP_HOST=smtp.provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=The Give Hub
```

### File Storage

```
# For local file storage
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads

# For S3-compatible storage
STORAGE_TYPE=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
```

### KYC Integration

```
# KYC provider settings (example for Veriff)
KYC_PROVIDER=veriff
KYC_API_KEY=your_kyc_api_key
KYC_SECRET=your_kyc_secret
KYC_CALLBACK_URL=https://api.yourdomain.com/kyc/callback
```

### Logging

```
# Logging configuration
LOG_LEVEL=info                  # debug, info, warn, error
LOG_FORMAT=json                 # text or json
LOG_OUTPUT=stdout               # stdout or file
LOG_FILE_PATH=./logs/app.log    # Path if using file output
```

## Advanced Configuration

### Horizontal Scaling

For deployments across multiple servers:

```
# Clustering and load balancing
CLUSTER_ENABLED=true
CLUSTER_WORKERS=auto            # Number of worker processes ('auto' uses CPU count)

# Session store for distributed setups
SESSION_STORE=redis             # Required for multi-server deployments
```

### Performance Tuning

```
# Cache settings
CACHE_TTL=3600                  # Cache time-to-live in seconds
QUERY_RESULT_LIMIT=100          # Default pagination limit

# Rate limiting per endpoint
RATE_LIMIT_AUTH=20              # Auth endpoint specific limit
RATE_LIMIT_CAMPAIGNS=50         # Campaigns endpoint specific limit
```

### Webhooks

```
# Webhook configuration
WEBHOOK_SECRET=your_webhook_signing_secret
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=60000       # Retry delay in milliseconds
```

## Environment-Specific Configurations

### Development Environment

Recommended settings for local development:

```
NODE_ENV=development
LOG_LEVEL=debug
STELLAR_NETWORK=testnet
```

### Production Environment

Critical settings for production deployment:

```
NODE_ENV=production
LOG_LEVEL=info
STELLAR_NETWORK=public

# Security enhancements
ENABLE_RATE_LIMITING=true
ENABLE_HELMET=true              # HTTP security headers
ENABLE_COMPRESSION=true         # Response compression
```

## Configuration Validation

The Give Hub performs validation of configuration values at startup. If critical configuration is missing or invalid, the application will exit with an error message.

## Applying Configuration Changes

- For Docker deployments: `docker-compose down && docker-compose up -d`
- For manual installations: Restart the application server

## Configuration Templates

Sample configuration templates are available in the `/config-templates` directory for different deployment scenarios:

- `development.env.example` - Local development setup
- `production.env.example` - Production deployment
- `docker.env.example` - Docker-specific settings

## Related Topics

- [Installation Guide](./installation.md)
- [Deployment Guide](../deployment-guide.md)
- [Security & Privacy](../security-privacy.md)"