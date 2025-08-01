#!/bin/bash
set -e

echo "Setting up SSL for api.gunswithroses.com..."

# Create SSL directory
mkdir -p ssl

# Generate SSL certificate with certbot
sudo certbot certonly --standalone -d api.gunswithroses.com --email admin@gunswithroses.com --agree-tos --no-eff-email

# Copy certificates
sudo cp /etc/letsencrypt/live/api.gunswithroses.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/api.gunswithroses.com/privkey.pem ssl/

# Fix permissions
sudo chown $USER:$USER ssl/*.pem
sudo chmod 644 ssl/fullchain.pem
sudo chmod 600 ssl/privkey.pem

echo "SSL setup complete!"