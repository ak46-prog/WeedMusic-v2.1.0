#!/bin/bash
# ============================================================
# WeedMusic v2.1.0 — GitHub Publishing Script
# ============================================================
# This script creates a new GitHub repo with proper staging
# naming convention and pushes the code.
#
# PREREQUISITES:
#   1. GitHub CLI installed: https://cli.github.com/
#   2. GitHub account logged in: gh auth login
#
# USAGE:
#   chmod +x publish.sh
#   ./publish.sh
# ============================================================

set -e

REPO_NAME="WeedMusic-v2.1.0"
DESCRIPTION="WeedMusic v2.1.0 - Free Ad-Free Music Streaming with YouTube, Firebase Auth, Car Mode & PWA"
BRANCH="main"

echo "=========================================="
echo "  WeedMusic v2.1.0 — GitHub Publisher"
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it: https://cli.github.com/"
    echo "   Then run: gh auth login"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI authenticated"
echo ""

# Create the repository
echo "📦 Creating repository: $REPO_NAME"
gh repo create "$REPO_NAME" \
    --public \
    --description "$DESCRIPTION" \
    --source=. \
    --push=false \
    2>/dev/null || echo "  (Repository may already exist)"

# Set the remote
echo "🔗 Setting remote origin..."
git remote remove origin 2>/dev/null || true
gh repo set-default "$REPO_NAME" 2>/dev/null || true
REMOTE_URL=$(gh repo view "$REPO_NAME" --json url -q '.url' 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
    git remote add origin "$REMOTE_URL.git"
    echo "  ✅ Remote set to $REMOTE_URL.git"
else
    # Fallback: get username from gh
    GH_USER=$(gh api user --jq '.login' 2>/dev/null || echo "YOUR_USERNAME")
    git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
    echo "  ✅ Remote set to https://github.com/$GH_USER/$REPO_NAME.git"
fi

# Create branches with staging convention
echo ""
echo "🌿 Creating branches..."

# Ensure we're on main
git checkout -B main 2>/dev/null || true

# Create staging branch
git branch -f staging main 2>/dev/null || git checkout -b staging
git checkout main

# Create develop branch
git branch -f develop main 2>/dev/null || git checkout -b develop
git checkout main

# Tag the release
echo "🏷️  Tagging release v2.1.0..."
git tag -a v2.1.0 -m "Release v2.1.0 - Fixed music loading, sound playback & staging CI/CD" 2>/dev/null || echo "  (Tag may already exist)"

# Push all branches
echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main --force
git push origin staging --force
git push origin develop --force
git push origin --tags --force 2>/dev/null || true

echo ""
echo "=========================================="
echo "  ✅ Successfully Published!"
echo "=========================================="
echo ""
echo "  Repository:  $(git remote get-url origin)"
echo "  Main:        main (production)"
echo "  Staging:     staging (pre-production)"
echo "  Develop:     develop (active development)"
echo "  Tag:         v2.1.0"
echo ""
echo "  Next Steps:"
echo "  1. Add VERCEL_TOKEN to GitHub Secrets"
echo "  2. Push to 'staging' branch for staging deploy"
echo "  3. Merge 'staging' → 'main' for production deploy"
echo ""
