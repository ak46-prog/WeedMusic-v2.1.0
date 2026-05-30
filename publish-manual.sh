#!/bin/bash
# ============================================================
# WeedMusic v2.1.0 — Manual GitHub Publishing Script
# ============================================================
# For users without GitHub CLI. Uses git + HTTPS.
#
# USAGE:
#   1. Create a repo on GitHub.com named "WeedMusic-v2.1.0"
#   2. Edit YOUR_GITHUB_USERNAME below
#   3. Run: bash publish-manual.sh
# ============================================================

set -e

# ===== EDIT YOUR USERNAME HERE =====
GH_USER="YOUR_GITHUB_USERNAME"
# ===================================

REPO_NAME="WeedMusic-v2.1.0"
REMOTE="https://github.com/$GH_USER/$REPO_NAME.git"

echo "=========================================="
echo "  WeedMusic v2.1.0 — Manual Publisher"
echo "=========================================="
echo ""
echo "  Target: $REMOTE"
echo ""

# Set remote
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"
echo "✅ Remote set to $REMOTE"

# Ensure on main
git checkout -B main 2>/dev/null || true

# Create staging branches
git branch -f staging main 2>/dev/null || true
git branch -f develop main 2>/dev/null || true

# Tag release
git tag -f v2.1.0 -m "Release v2.1.0" 2>/dev/null || true

echo ""
echo "🚀 Pushing to GitHub..."
echo "  (You will be prompted for your GitHub username/token)"
echo ""

git push -u origin main
git push origin staging
git push origin develop
git push origin v2.1.0 2>/dev/null || true

echo ""
echo "✅ Done! Your repo is at: $REMOTE"
