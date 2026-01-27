#!/bin/bash
# Steward VPS Setup Script
# Idempotent setup script for Ubuntu VPS deployment
# Usage: sudo bash setup_vps.sh [REPO_URL=https://...]

set -e  # Exit on error

REPO_URL="${REPO_URL:-}"

echo "=========================================="
echo "Steward VPS Setup Script"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root or with sudo"
    exit 1
fi

# Update package list
echo "[1/8] Updating package list..."
apt update -qq

# Install required packages
echo "[2/8] Installing required packages..."
apt install -y \
    nginx \
    git \
    curl \
    certbot \
    python3-certbot-nginx \
    build-essential

# Install Node.js 20.x
echo "[3/8] Installing Node.js 20.x..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt "20" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "Node.js $(node -v) already installed"
fi

# Verify Node.js installation
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "Node.js version: $NODE_VERSION"
echo "npm version: $NPM_VERSION"

# Create application directory
echo "[4/8] Creating application directory..."
mkdir -p /opt/steward
chown -R $SUDO_USER:$SUDO_USER /opt/steward 2>/dev/null || chown -R root:root /opt/steward

# Create web root directory
echo "[5/8] Creating web root directory..."
mkdir -p /var/www/steward
chown -R www-data:www-data /var/www/steward
chmod -R 755 /var/www/steward

# Create uploads directory
echo "[6/8] Creating uploads directory..."
mkdir -p /opt/steward/server/uploads
chown -R www-data:www-data /opt/steward/server/uploads
chmod -R 755 /opt/steward/server/uploads

# Clone repository if REPO_URL is provided
if [ -n "$REPO_URL" ]; then
    echo "[7/8] Cloning repository from $REPO_URL..."
    cd /opt/steward
    if [ -d ".git" ]; then
        echo "Repository already exists, skipping clone"
    else
        git clone "$REPO_URL" .
        chown -R $SUDO_USER:$SUDO_USER /opt/steward 2>/dev/null || chown -R root:root /opt/steward
    fi
else
    echo "[7/8] No REPO_URL provided, skipping repository clone"
    echo ""
    echo "=========================================="
    echo "Next steps:"
    echo "=========================================="
    echo "1. Deploy your code to /opt/steward"
    echo "   Example:"
    echo "   cd /opt/steward"
    echo "   git clone https://github.com/yourusername/steward.git ."
    echo ""
    echo "   Or upload via SCP:"
    echo "   scp -r /path/to/steward/* root@your-server:/opt/steward/"
    echo ""
    echo "2. Build the application:"
    echo "   cd /opt/steward"
    echo "   npm install"
    echo "   npm run build"
    echo "   cd server"
    echo "   npm install"
    echo "   npm run build"
    echo ""
    echo "3. Copy frontend build:"
    echo "   cp -r /opt/steward/dist/* /var/www/steward/"
    echo ""
    echo "4. Continue with deployment steps in README_DEPLOY.md"
    echo "=========================================="
fi

# Final status
echo "[8/8] Setup complete!"
echo ""
echo "Installed packages:"
echo "  - nginx: $(nginx -v 2>&1)"
echo "  - Node.js: $NODE_VERSION"
echo "  - npm: $NPM_VERSION"
echo "  - git: $(git --version)"
echo "  - certbot: $(certbot --version 2>&1 | head -n1)"
echo ""
echo "Directories created:"
echo "  - /opt/steward (application code)"
echo "  - /var/www/steward (web root)"
echo "  - /opt/steward/server/uploads (uploads directory)"
echo ""
echo "Next steps: See README_DEPLOY.md for deployment instructions"
