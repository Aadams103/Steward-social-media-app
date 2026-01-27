# Steward Production Deployment Guide

## Railway Quick Start

For cloud deployment, see **[Railway Deployment Guide](./README_RAILWAY.md)** for step-by-step instructions.

---

This guide provides step-by-step instructions for deploying Steward to an Ubuntu VPS (Kamatera).

## Prerequisites

- Ubuntu 22.04+ VPS with root/sudo access
- Domain name pointing to your VPS IP
- SSH access to the server

## Quick Start (Copy/Paste Commands)

### 1. Initial Server Setup

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Run the setup script
cd /opt
sudo bash setup_vps.sh

# If you have a git repository URL, you can provide it:
# sudo REPO_URL=https://github.com/yourusername/steward.git bash setup_vps.sh
```

**Note for PowerShell users:** Run commands one at a time. PowerShell doesn't support `&&` syntax.

### 2. Deploy Application Code

If you didn't provide `REPO_URL` in step 1, manually deploy your code:

```bash
# Option A: Clone from Git
cd /opt/steward
sudo git clone https://github.com/yourusername/steward.git .

# Option B: Upload via SCP (from your local machine)
# scp -r /path/to/steward/* root@your-server:/opt/steward/
```

### 3. Build Frontend and Backend

```bash
cd /opt/steward

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Install backend dependencies
cd server
npm install

# Build backend
npm run build
cd ..
```

### 4. Configure Environment Variables

```bash
# Create backend .env file
sudo nano /opt/steward/server/.env
```

Add your environment variables (example):
```
NODE_ENV=production
PORT=8080
# Add other required variables
```

### 5. Deploy Frontend Build

```bash
# Copy frontend dist to web root
sudo cp -r /opt/steward/dist/* /var/www/steward/
sudo chown -R www-data:www-data /var/www/steward
```

### 6. Install Systemd Service

```bash
# Copy service file
sudo cp /opt/steward/deploy/steward-api.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable steward-api
sudo systemctl start steward-api

# Check status
sudo systemctl status steward-api
```

### 7. Configure Nginx

```bash
# Copy nginx config
sudo cp /opt/steward/deploy/nginx-steward.conf /etc/nginx/sites-available/steward

# Create symlink
sudo ln -s /etc/nginx/sites-available/steward /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 8. Setup SSL with Let's Encrypt

```bash
# Install certbot (if not already installed)
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace yourdomain.com with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure nginx and set up auto-renewal
```

### 9. Verify Deployment

```bash
# Run verification script
cd /opt/steward/deploy
sudo bash verify.sh
```

## Manual Verification

```bash
# Check backend health
curl http://localhost:8080/api/health

# Check systemd service
sudo systemctl status steward-api

# Check nginx status
sudo systemctl status nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check backend logs
sudo journalctl -u steward-api -f
```

## Updating the Application

```bash
cd /opt/steward

# Pull latest changes (if using git)
sudo git pull

# Rebuild frontend
npm run build

# Rebuild backend
cd server
npm run build
cd ..

# Copy new frontend build
sudo cp -r dist/* /var/www/steward/

# Restart backend service
sudo systemctl restart steward-api

# Reload nginx (usually not needed, but safe)
sudo systemctl reload nginx
```

## Troubleshooting

### Backend not starting

```bash
# Check service logs
sudo journalctl -u steward-api -n 50

# Check if port 8080 is in use
sudo netstat -tlnp | grep 8080

# Test backend manually
cd /opt/steward/server
node dist/index.js
```

### Nginx errors

```bash
# Test nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Frontend not loading

```bash
# Verify files are in place
ls -la /var/www/steward/

# Check permissions
sudo chown -R www-data:www-data /var/www/steward
sudo chmod -R 755 /var/www/steward
```

### WebSocket connection issues

- Verify nginx config includes WebSocket upgrade headers
- Check firewall allows connections on port 80/443
- Verify backend WebSocket server is running on `/ws` path

## File Locations

- **Application code:** `/opt/steward`
- **Frontend build:** `/var/www/steward`
- **Backend service:** `/etc/systemd/system/steward-api.service`
- **Nginx config:** `/etc/nginx/sites-available/steward`
- **Backend logs:** `journalctl -u steward-api`
- **Nginx logs:** `/var/log/nginx/`

## Security Notes

- Ensure firewall is configured (UFW recommended)
- Keep system updated: `sudo apt update && sudo apt upgrade`
- Use strong passwords and SSH keys
- Regularly backup `/opt/steward` and database (if applicable)
- Review nginx security headers in production

## PowerShell Users

If you're using PowerShell on Windows to SSH into the server, note that:

1. **No `&&` operator:** Run commands separately
2. **Line continuation:** Use backticks `` ` `` for multi-line commands
3. **Path separators:** Use forward slashes `/` in Linux paths

Example PowerShell session:
```powershell
ssh user@your-server
# Then run commands one at a time:
sudo apt update
sudo apt upgrade -y
cd /opt
sudo bash setup_vps.sh
```
