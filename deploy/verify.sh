#!/bin/bash
# Hostess Deployment Verification Script
# Checks that all services are running correctly

set -e

echo "=========================================="
echo "Hostess Deployment Verification"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED=1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

FAILED=0

# 1. Check systemd service status
echo "1. Checking hostess-api service..."
if systemctl is-active --quiet hostess-api; then
    check_pass "hostess-api service is running"
    systemctl status hostess-api --no-pager -l | head -n 5
else
    check_fail "hostess-api service is not running"
    echo "   Run: sudo systemctl status hostess-api"
fi
echo ""

# 2. Check nginx status
echo "2. Checking nginx service..."
if systemctl is-active --quiet nginx; then
    check_pass "nginx service is running"
    if nginx -t 2>&1 | grep -q "successful"; then
        check_pass "nginx configuration is valid"
    else
        check_fail "nginx configuration has errors"
        nginx -t
    fi
else
    check_fail "nginx service is not running"
fi
echo ""

# 3. Check backend health endpoint
echo "3. Checking backend health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/api/health || echo "000")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    check_pass "Backend health endpoint responds (HTTP $HEALTH_RESPONSE)"
    HEALTH_BODY=$(curl -s http://127.0.0.1:8080/api/health)
    echo "   Response: $HEALTH_BODY"
else
    check_fail "Backend health endpoint failed (HTTP $HEALTH_RESPONSE)"
    echo "   Check: curl http://127.0.0.1:8080/api/health"
fi
echo ""

# 4. Check backend via nginx proxy
echo "4. Checking backend via nginx proxy..."
PROXY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")
if [ "$PROXY_RESPONSE" = "200" ]; then
    check_pass "Backend accessible via nginx proxy (HTTP $PROXY_RESPONSE)"
else
    check_fail "Backend not accessible via nginx proxy (HTTP $PROXY_RESPONSE)"
    echo "   Check nginx configuration and logs"
fi
echo ""

# 5. Check frontend files
echo "5. Checking frontend files..."
if [ -f "/var/www/hostess/index.html" ]; then
    check_pass "Frontend index.html exists"
    FRONTEND_SIZE=$(du -sh /var/www/hostess 2>/dev/null | cut -f1)
    echo "   Frontend size: $FRONTEND_SIZE"
else
    check_fail "Frontend index.html not found at /var/www/hostess/index.html"
fi
echo ""

# 6. Check port 8080 is listening
echo "6. Checking backend port..."
if netstat -tlnp 2>/dev/null | grep -q ":8080" || ss -tlnp 2>/dev/null | grep -q ":8080"; then
    check_pass "Port 8080 is listening"
    PORT_INFO=$(netstat -tlnp 2>/dev/null | grep ":8080" || ss -tlnp 2>/dev/null | grep ":8080")
    echo "   $PORT_INFO"
else
    check_fail "Port 8080 is not listening"
    echo "   Backend may not be running"
fi
echo ""

# 7. Check port 80 is listening (nginx)
echo "7. Checking nginx port..."
if netstat -tlnp 2>/dev/null | grep -q ":80" || ss -tlnp 2>/dev/null | grep -q ":80"; then
    check_pass "Port 80 is listening (nginx)"
else
    check_warn "Port 80 is not listening (may be normal if using HTTPS only)"
fi
echo ""

# 8. Check file permissions
echo "8. Checking file permissions..."
if [ -r "/opt/hostess/server/dist/index.js" ]; then
    check_pass "Backend dist/index.js is readable"
else
    check_fail "Backend dist/index.js not found or not readable"
fi

if [ -r "/var/www/hostess/index.html" ]; then
    check_pass "Frontend index.html is readable"
else
    check_fail "Frontend index.html not readable"
fi
echo ""

# 9. Check recent logs for errors
echo "9. Checking recent service logs..."
RECENT_ERRORS=$(journalctl -u hostess-api --since "5 minutes ago" --no-pager | grep -i error | tail -n 3 || true)
if [ -z "$RECENT_ERRORS" ]; then
    check_pass "No recent errors in hostess-api logs"
else
    check_warn "Recent errors found in hostess-api logs:"
    echo "$RECENT_ERRORS"
fi
echo ""

# Summary
echo "=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your deployment appears to be working correctly."
    echo "You can now access your application at:"
    echo "  - http://your-domain.com (or http://your-server-ip)"
    echo ""
    echo "Next steps:"
    echo "  1. Configure your domain in nginx config"
    echo "  2. Set up SSL with: sudo certbot --nginx -d yourdomain.com"
    exit 0
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo ""
    echo "Please review the errors above and:"
    echo "  1. Check service logs: sudo journalctl -u hostess-api -n 50"
    echo "  2. Check nginx logs: sudo tail -f /var/log/nginx/error.log"
    echo "  3. Verify configuration files are in place"
    echo "  4. See README_DEPLOY.md for troubleshooting"
    exit 1
fi
