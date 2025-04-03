# The Give Hub - Deployment Guide

## Overview

This document provides instructions for deploying The Give Hub platform in various environments. It covers both development setup and production deployment with best practices for security, performance, and maintenance.

## System Requirements

### Minimum Requirements

- **Web Server**: Apache 2.4+ or Nginx 1.14+
- **PHP**: 7.4+ with MongoDB extension
- **MongoDB**: 4.0+
- **Storage**: 10GB+ for application and uploads
- **Memory**: 4GB RAM minimum
- **SSL Certificate**: Required for secure connections

### Recommended Production Specifications

- **Web Server**: Nginx 1.20+
- **PHP**: 8.0+ with OpCache enabled
- **MongoDB**: 4.4+ with replication
- **Storage**: 50GB+ SSD storage with backup solution
- **Memory**: 8GB RAM or more
- **SSL Certificate**: Let's Encrypt or commercial SSL
- **CDN**: For static assets and uploads

## Development Environment Setup

### Local Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/thegivehub/platform.git
   cd platform
   ```

2. **Set Up Environment Variables**
   Create a `.env` file in the root directory:
   ```
   # Application settings
   APP_ENV=development
   APP_DEBUG=true
   
   # Database settings
   MONGODB_HOST=localhost
   MONGODB_PORT=27017
   MONGODB_DATABASE=givehub
   MONGODB_USERNAME=
   MONGODB_PASSWORD=
   
   # JWT settings
   JWT_SECRET=development-secret-key
   JWT_REFRESH_SECRET=development-refresh-secret
   JWT_ACCESS_EXPIRY=3600
   JWT_REFRESH_EXPIRY=604800
   
   # File storage
   UPLOAD_DIR=uploads
   MAX_UPLOAD_SIZE=10485760  # 10MB
   
   # Email settings
   MAIL_HOST=localhost
   MAIL_PORT=1025
   MAIL_USERNAME=null
   MAIL_PASSWORD=null
   MAIL_ENCRYPTION=null
   MAIL_FROM_ADDRESS=dev@thegivehub.local
   MAIL_FROM_NAME="The Give Hub (Dev)"
   ```

3. **Install MongoDB**
   
   **For Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install -y mongodb
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```
   
   **For macOS (using Homebrew):**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```
   
   **For Windows:**
   Download and install from the [MongoDB website](https://www.mongodb.com/try/download/community)

4. **Install PHP and Extensions**
   
   **For Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install -y php php-cli php-fpm php-mongodb php-mbstring php-json php-curl php-gd
   ```
   
   **For macOS (using Homebrew):**
   ```bash
   brew install php
   pecl install mongodb
   echo "extension=mongodb.so" >> /usr/local/etc/php/7.4/php.ini
   ```
   
   **For Windows:**
   Install PHP from [windows.php.net](https://windows.php.net/download/) and enable required extensions in php.ini

5. **Set Up Web Server**
   
   **For Apache:**
   ```bash
   # Configure a virtual host in httpd.conf or apache2.conf
   <VirtualHost *:80>
       ServerName givehub.local
       DocumentRoot /path/to/platform/public
       
       <Directory /path/to/platform/public>
           AllowOverride All
           Require all granted
       </Directory>
       
       ErrorLog ${APACHE_LOG_DIR}/givehub_error.log
       CustomLog ${APACHE_LOG_DIR}/givehub_access.log combined
   </VirtualHost>
   ```
   
   **For Nginx:**
   ```nginx
   server {
       listen 80;
       server_name givehub.local;
       root /path/to/platform/public;
       
       index index.php index.html;
       
       location / {
           try_files $uri $uri/ /index.php?$query_string;
       }
       
       location ~ \.php$ {
           include fastcgi_params;
           fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
           fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
       }
   }
   ```

6. **Set Directory Permissions**
   ```bash
   chmod -R 755 public
   chmod -R 777 uploads logs
   ```

7. **Update Hosts File**
   Add the following to your `/etc/hosts` file (or `C:\Windows\System32\drivers\etc\hosts` on Windows):
   ```
   127.0.0.1 givehub.local
   ```

8. **Initialize Database**
   ```bash
   # Using the provided setup script
   php scripts/setup.php --init-db
   ```

### Using Docker (Alternative)

1. **Install Docker and Docker Compose**
   Follow instructions at [docker.com](https://docs.docker.com/get-docker/)

2. **Create Docker Compose File**
   Create a `docker-compose.yml` file:
   ```yaml
   version: '3'
   
   services:
     app:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "8080:80"
       volumes:
         - ./:/var/www/html
         - ./uploads:/var/www/html/uploads
       depends_on:
         - mongo
       environment:
         MONGODB_HOST: mongo
         MONGODB_PORT: 27017
         MONGODB_DATABASE: givehub
   
     mongo:
       image: mongo:4.4
       ports:
         - "27017:27017"
       volumes:
         - mongodb_data:/data/db
   
   volumes:
     mongodb_data:
   ```

3. **Create Dockerfile**
   ```dockerfile
   FROM php:7.4-apache
   
   # Install dependencies
   RUN apt-get update && apt-get install -y \
       libcurl4-openssl-dev \
       pkg-config \
       libssl-dev \
       git \
       zip \
       unzip
   
   # Install MongoDB extension
   RUN pecl install mongodb && \
       docker-php-ext-enable mongodb
   
   # Install other PHP extensions
   RUN docker-php-ext-install curl
   
   # Configure Apache
   RUN a2enmod rewrite
   
   # Set working directory
   WORKDIR /var/www/html
   
   # Copy application files
   COPY . /var/www/html
   
   # Set permissions
   RUN chmod -R 755 /var/www/html && \
       chmod -R 777 /var/www/html/uploads /var/www/html/logs
   
   # Apache configuration
   RUN echo 'DocumentRoot /var/www/html/public' >> /etc/apache2/sites-available/000-default.conf
   
   EXPOSE 80
   ```

4. **Build and Run Docker Environment**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

5. **Initialize Database in Docker**
   ```bash
   docker-compose exec app php scripts/setup.php --init-db
   ```

## Production Deployment

### Pre-Deployment Checklist

1. **Security Review**
   - Remove development tokens and keys
   - Ensure proper file permissions
   - Audit code for security issues
   - Review environment variables

2. **Performance Optimization**
   - Enable PHP OpCache
   - Configure caching
   - Optimize MongoDB indexes
   - Minify CSS/JS assets

3. **Backup Strategy**
   - Set up automated backups for MongoDB
   - Configure file system backups
   - Test restoration procedures

### Server Preparation

1. **Update System Packages**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **Install Required Packages**
   ```bash
   sudo apt install -y nginx php-fpm php-mongodb php-mbstring php-json php-curl php-gd ssl-cert
   ```

3. **Install MongoDB**
   ```bash
   # Import MongoDB public GPG key
   wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
   
   # Add MongoDB repository
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
   
   # Install MongoDB
   sudo apt update
   sudo apt install -y mongodb-org
   
   # Start and enable MongoDB
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

4. **Configure PHP**
   Create/edit `/etc/php/7.4/fpm/conf.d/99-givehub.ini`:
   ```ini
   ; Maximum upload file size
   upload_max_filesize = 10M
   post_max_size = 10M
   
   ; Increase memory limit for large operations
   memory_limit = 256M
   
   ; Set timezone
   date.timezone = UTC
   
   ; OpCache settings for performance
   opcache.enable=1
   opcache.memory_consumption=128
   opcache.interned_strings_buffer=8
   opcache.max_accelerated_files=4000
   opcache.revalidate_freq=60
   opcache.fast_shutdown=1
   ```

5. **Restart PHP-FPM**
   ```bash
   sudo systemctl restart php7.4-fpm
   ```

### Application Deployment

1. **Create Application Directory**
   ```bash
   sudo mkdir -p /var/www/givehub
   sudo chown www-data:www-data /var/www/givehub
   ```

2. **Deploy Application Code**
   ```bash
   # Using Git
   git clone https://github.com/thegivehub/platform.git /var/www/givehub
   
   # Or deploy using rsync
   rsync -avz --exclude '.git' --exclude 'node_modules' --exclude '.env' /path/to/local/code/ user@server:/var/www/givehub/
   ```

3. **Set Production Environment Variables**
   Create `/var/www/givehub/.env`:
   ```
   # Application settings
   APP_ENV=production
   APP_DEBUG=false
   
   # Database settings
   MONGODB_HOST=localhost
   MONGODB_PORT=27017
   MONGODB_DATABASE=givehub
   MONGODB_USERNAME=givehub_user
   MONGODB_PASSWORD=strong_password_here
   
   # JWT settings
   JWT_SECRET=random_strong_secret_key_here
   JWT_REFRESH_SECRET=another_random_strong_secret_key_here
   JWT_ACCESS_EXPIRY=3600
   JWT_REFRESH_EXPIRY=604800
   
   # File storage
   UPLOAD_DIR=uploads
   MAX_UPLOAD_SIZE=10485760  # 10MB
   
   # Email settings
   MAIL_HOST=smtp.provider.com
   MAIL_PORT=587
   MAIL_USERNAME=noreply@thegivehub.com
   MAIL_PASSWORD=mail_password_here
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS=noreply@thegivehub.com
   MAIL_FROM_NAME="The Give Hub"
   ```

4. **Set Directory Permissions**
   ```bash
   sudo chown -R www-data:www-data /var/www/givehub
   sudo chmod -R 755 /var/www/givehub
   sudo chmod -R 777 /var/www/givehub/uploads /var/www/givehub/logs
   ```

5. **Set Up MongoDB User**
   ```bash
   # Connect to MongoDB
   mongo
   
   # Create database and user
   use givehub
   db.createUser({
     user: "givehub_user",
     pwd: "strong_password_here",
     roles: [{ role: "readWrite", db: "givehub" }]
   })
   
   # Exit MongoDB shell
   exit
   ```

6. **Enable MongoDB Authentication**
   Edit `/etc/mongod.conf`:
   ```yaml
   security:
     authorization: enabled
   ```

7. **Restart MongoDB**
   ```bash
   sudo systemctl restart mongod
   ```

8. **Initialize Production Database**
   ```bash
   cd /var/www/givehub
   sudo -u www-data php scripts/setup.php --init-db --env=production
   ```

### Web Server Configuration

1. **Configure Nginx**
   Create `/etc/nginx/sites-available/givehub`:
   ```nginx
   server {
       listen 80;
       server_name thegivehub.com www.thegivehub.com;
       return 301 https://$host$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name thegivehub.com www.thegivehub.com;
       
       ssl_certificate /etc/letsencrypt/live/thegivehub.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/thegivehub.com/privkey.pem;
       
       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
       ssl_session_timeout 1d;
       ssl_session_cache shared:SSL:50m;
       ssl_stapling on;
       ssl_stapling_verify on;
       
       # Security headers
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
       add_header X-Content-Type-Options nosniff;
       add_header X-Frame-Options DENY;
       add_header X-XSS-Protection "1; mode=block";
       add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'";
       add_header Referrer-Policy strict-origin-when-cross-origin;
       add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
   
       root /var/www/givehub/public;
       index index.php index.html;
       
       # Application handling
       location / {
           try_files $uri $uri/ /index.php?$query_string;
       }
       
       # Protect sensitive files
       location ~ \.(?:env|gitignore|md)$ {
           deny all;
       }
       
       # PHP handling
       location ~ \.php$ {
           fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
           fastcgi_index index.php;
           fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
           include fastcgi_params;
           
           # Hide PHP version
           fastcgi_hide_header X-Powered-By;
       }
       
       # Static assets with caching
       location ~* \.(?:css|js|jpg|jpeg|png|gif|ico|svg)$ {
           expires 30d;
           add_header Cache-Control "public, max-age=2592000";
           try_files $uri =404;
       }
       
       # Logs
       error_log /var/log/nginx/givehub_error.log;
       access_log /var/log/nginx/givehub_access.log;
   }
   ```

2. **Enable Site and Reload Nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/givehub /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Set Up SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d thegivehub.com -d www.thegivehub.com
   ```

### Cron Jobs

Set up necessary cron jobs for maintenance tasks:

```bash
sudo crontab -e
```

Add the following lines:

```
# Database backup every day at 2 AM
0 2 * * * mongodump --db givehub --out /backup/mongodb/$(date +\%Y-\%m-\%d)

# Cleanup old backups (keep last 30 days)
0 3 * * * find /backup/mongodb/ -type d -mtime +30 -exec rm -rf {} \;

# Run maintenance tasks
0 1 * * * cd /var/www/givehub && php scripts/maintenance.php --clean-temp
0 0 * * 0 cd /var/www/givehub && php scripts/maintenance.php --optimize-db
```

## Scaling Considerations

### Horizontal Scaling

For high-traffic deployments, consider:

1. **Web Server Load Balancing**
   - Deploy multiple web server instances
   - Use Nginx or HAProxy as a load balancer
   - Configure sticky sessions if needed

2. **MongoDB Replication**
   - Set up a MongoDB replica set
   - Configure one primary and multiple secondary nodes
   - Distribute read operations across secondaries

3. **File Storage**
   - Move file storage to a dedicated service (S3, etc.)
   - Update application configuration to use external storage

### Caching Strategy

Implement caching to improve performance:

1. **Application Caching**
   - Add Redis or Memcached for application cache
   - Cache frequently accessed data
   - Implement cache invalidation strategies

2. **Page Caching**
   - Use Nginx FastCGI Cache for full-page caching
   - Configure cache timeouts appropriately
   - Exclude dynamic content from caching

3. **CDN Integration**
   - Configure a CDN for static assets
   - Use cache-control headers for optimal caching
   - Purge CDN cache when content changes

## Monitoring and Maintenance

### Monitoring Setup

1. **System Monitoring**
   - Install and configure monitoring tools (Prometheus, Grafana, etc.)
   - Set up alerts for CPU, memory, and disk usage
   - Monitor server response times

2. **Application Monitoring**
   - Implement application logging
   - Set up error tracking (Sentry, etc.)
   - Monitor API endpoint performance

3. **Database Monitoring**
   - Track MongoDB performance metrics
   - Monitor query execution times
   - Set up alerts for slow queries

### Backup Procedures

1. **Database Backups**
   - Scheduled MongoDB dumps
   - Consider incremental backup strategies
   - Regular backup verification

2. **Application Backups**
   - Version control for code
   - Configuration file backups
   - Regular testing of restoration process

3. **Disaster Recovery**
   - Document disaster recovery procedures
   - Regular recovery drills
   - Offsite backup storage

### Updating Procedures

1. **Code Updates**
   ```bash
   # Backup current code
   sudo cp -r /var/www/givehub /var/www/givehub-backup-$(date +%Y%m%d)
   
   # Pull updates
   cd /var/www/givehub
   sudo -u www-data git pull
   
   # Update permissions if needed
   sudo chown -R www-data:www-data /var/www/givehub
   sudo chmod -R 755 /var/www/givehub
   sudo chmod -R 777 /var/www/givehub/uploads /var/www/givehub/logs
   
   # Restart services if needed
   sudo systemctl restart php7.4-fpm
   ```

2. **Database Updates**
   ```bash
   # Run database migrations
   cd /var/www/givehub
   sudo -u www-data php scripts/migrations.php
   ```

3. **Rollback Procedure**
   ```bash
   # If update fails, restore from backup
   sudo rm -rf /var/www/givehub
   sudo cp -r /var/www/givehub-backup-YYYYMMDD /var/www/givehub
   sudo chown -R www-data:www-data /var/www/givehub
   
   # Restore database if needed
   mongorestore --db givehub /backup/mongodb/YYYY-MM-DD/givehub
   
   # Restart services
   sudo systemctl restart php7.4-fpm
   ```

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check Nginx error logs: `sudo tail -f /var/log/nginx/givehub_error.log`
   - Check PHP-FPM logs: `sudo tail -f /var/log/php7.4-fpm.log`
   - Verify file permissions and ownership

2. **MongoDB Connection Issues**
   - Check MongoDB status: `sudo systemctl status mongod`
   - Verify MongoDB authentication settings
   - Check network connectivity and firewall rules

3. **File Upload Problems**
   - Check upload directory permissions
   - Verify PHP upload size configurations
   - Check disk space availability

### Log Locations

- **Nginx Access Logs**: `/var/log/nginx/givehub_access.log`
- **Nginx Error Logs**: `/var/log/nginx/givehub_error.log`
- **PHP-FPM Logs**: `/var/log/php7.4-fpm.log`
- **MongoDB Logs**: `/var/log/mongodb/mongod.log`
- **Application Logs**: `/var/www/givehub/logs/app-YYYY-MM-DD.log`

## Conclusion

This deployment guide covers the basic setup and configuration for The Give Hub platform. Adjust the steps according to your specific environment and requirements. Always follow security best practices and keep all software components updated to their latest stable versions.

For additional support, refer to the technical documentation or contact the development team.
