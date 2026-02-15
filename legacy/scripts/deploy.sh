#!/bin/bash

# AlphaX AI Deployment Script
# This script helps deploy the application to production

set -e

echo "🚀 Deploying AlphaX AI to Production..."

# Configuration
DEPLOY_USER=${DEPLOY_USER:-"alphaxai"}
DEPLOY_HOST=${DEPLOY_HOST:-"your-server.com"}
DEPLOY_PATH=${DEPLOY_PATH:-"/var/www/alphaxai"}
BACKUP_PATH=${BACKUP_PATH:-"/var/backups/alphaxai"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if production environment file exists
if [ ! -f .env.production ]; then
    log_error ".env.production file not found. Please create it before deploying."
    exit 1
fi

# Run tests before deployment
log_info "Running tests..."
npm test

if [ $? -ne 0 ]; then
    log_error "Tests failed. Deployment aborted."
    exit 1
fi

# Build the application
log_info "Building application..."
npm run build

# Create deployment package
log_info "Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="alphaxai_${TIMESTAMP}.tar.gz"

tar -czf $PACKAGE_NAME \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=coverage \
    --exclude=logs \
    --exclude=uploads \
    --exclude=*.tar.gz \
    .

log_info "Package created: $PACKAGE_NAME"

# Deploy to server
log_info "Deploying to server..."

if [ "$1" = "--local" ]; then
    log_info "Local deployment mode"
    
    # Local deployment (for testing)
    mkdir -p ./deploy_test
    tar -xzf $PACKAGE_NAME -C ./deploy_test
    cd ./deploy_test
    
    # Copy production environment
    cp ../.env.production .env
    
    # Install production dependencies
    npm ci --only=production
    
    log_info "Local deployment complete in ./deploy_test"
    
else
    # Remote deployment
    log_info "Deploying to ${DEPLOY_HOST}..."
    
    # Copy package to server
    scp $PACKAGE_NAME ${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/
    
    # Deploy on server
    ssh ${DEPLOY_USER}@${DEPLOY_HOST} << EOF
        set -e
        
        # Create backup of current deployment
        if [ -d "$DEPLOY_PATH" ]; then
            echo "Creating backup..."
            sudo mkdir -p $BACKUP_PATH
            sudo tar -czf $BACKUP_PATH/backup_${TIMESTAMP}.tar.gz -C $DEPLOY_PATH .
        fi
        
        # Prepare deployment directory
        sudo mkdir -p $DEPLOY_PATH
        sudo chown $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH
        
        # Extract new version
        cd $DEPLOY_PATH
        tar -xzf /tmp/$PACKAGE_NAME
        
        # Install dependencies
        npm ci --only=production
        
        # Copy environment file
        sudo cp /etc/alphaxai/.env.production .env
        
        # Set permissions
        sudo chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH
        sudo chmod -R 755 $DEPLOY_PATH
        
        # Restart services
        sudo systemctl restart alphaxai
        sudo systemctl restart nginx
        
        # Check if deployment was successful
        sleep 5
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo "✅ Deployment successful!"
        else
            echo "❌ Deployment failed - service not responding"
            exit 1
        fi
        
        # Cleanup
        rm /tmp/$PACKAGE_NAME
EOF

    if [ $? -eq 0 ]; then
        log_info "Deployment completed successfully!"
        log_info "Application is now running at https://${DEPLOY_HOST}"
    else
        log_error "Deployment failed!"
        exit 1
    fi
fi

# Cleanup local package
rm $PACKAGE_NAME

log_info "Deployment script completed!"

echo ""
echo "Post-deployment checklist:"
echo "1. Check application logs: sudo journalctl -u alphaxai -f"
echo "2. Monitor system resources: htop"
echo "3. Verify database connectivity"
echo "4. Test API endpoints"
echo "5. Check SSL certificates (if applicable)"
echo ""