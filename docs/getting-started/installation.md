# Installation Guide

## Overview

This guide walks you through the process of installing and setting up The Give Hub platform on your infrastructure. The Give Hub is a modern web application built with a microservices architecture, utilizing blockchain technology for donation management.

## System Requirements

### Minimum Hardware Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 100Mbps connection

### Recommended Hardware Requirements
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 100GB+ SSD
- **Network**: 1Gbps connection

### Software Requirements
- **Operating System**: Ubuntu 20.04 LTS or later
- **Docker**: 20.10 or later
- **Docker Compose**: 2.0 or later
- **Node.js**: 16.x or later (for development only)
- **PostgreSQL**: 13.x or later (if not using Docker)
- **Redis**: 6.x or later (if not using Docker)

## Installation Methods

### Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/thegivehub/platform.git
   cd platform
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration settings.

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec api npm run migrate
   ```

5. **Create admin user**
   ```bash
   docker-compose exec api npm run create-admin
   ```

### Manual Installation

For environments where Docker is not available, follow these steps:

1. **Install dependencies**
   ```bash
   # Install PostgreSQL
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # Install Redis
   sudo apt install redis-server

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Clone the repository**
   ```bash
   git clone https://github.com/thegivehub/platform.git
   cd platform
   ```

3. **Install application dependencies**
   ```bash
   npm install
   ```

4. **Configure database**
   ```bash
   sudo -u postgres createuser -P givehub
   sudo -u postgres createdb -O givehub givehub_db
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration settings.

6. **Run database migrations**
   ```bash
   npm run migrate
   ```

7. **Start the application**
   ```bash
   npm run start
   ```

## Stellar Network Configuration

The Give Hub requires connection to the Stellar blockchain network.

1. **Generate Stellar keys**
   ```bash
   npm run generate-stellar-keys
   ```

2. **Fund development account** (for testnet)
   ```bash
   npm run fund-testnet-account
   ```

3. **Configure Stellar settings in .env file**
   ```
   STELLAR_NETWORK=testnet  # Use 'public' for production
   STELLAR_SECRET_KEY=your_generated_secret_key
   STELLAR_PUBLIC_KEY=your_generated_public_key
   ```

## Verifying Installation

1. **Check if services are running**
   ```bash
   docker-compose ps  # For Docker installation
   # or
   systemctl status givehub  # For manual installation with systemd
   ```

2. **Test the API**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"status":"ok"}`

3. **Access the web interface**
   Open `http://localhost:8080` in your web browser

## Next Steps

After successful installation:

1. Complete the [Configuration](./configuration.md) steps
2. Follow the [Quick Start Guide](./quick-start.md) to create your first campaign
3. Set up [SSL and domain configuration](../deployment-guide.md) for production environments

## Troubleshooting

### Common Issues

- **Database connection errors**: Ensure PostgreSQL is running and credentials are correct
- **Blockchain connectivity issues**: Check network settings and Stellar configuration
- **Port conflicts**: Make sure required ports are available and not blocked by firewall

For more detailed troubleshooting, refer to our [Support Forum](https://community.thegivehub.com) or [GitHub Issues](https://github.com/thegivehub/platform/issues)."