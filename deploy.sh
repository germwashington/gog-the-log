#!/bin/bash

# Tyrian Reborn - GitHub Pages Deployment Script
# This script helps automate the deployment process

echo "🚀 Tyrian Reborn - GitHub Pages Deployment"
echo "=========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Initializing..."
    git init
    git branch -M main
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Found uncommitted changes. Committing..."
    git add .
    read -p "Enter commit message (or press Enter for default): " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="Update game files for deployment"
    fi
    git commit -m "$commit_msg"
else
    echo "✅ No uncommitted changes found."
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin found."
    echo "Please add your GitHub repository as origin:"
    echo "git remote add origin https://github.com/YOURUSERNAME/YOURREPOSITORY.git"
    exit 1
fi

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Next steps:"
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings → Pages"
echo "3. Set Source to 'GitHub Actions'"
echo "4. Wait for deployment to complete"
echo ""
echo "Your game will be available at:"
echo "https://YOURUSERNAME.github.io/YOURREPOSITORY/"
echo ""
echo "🎮 Happy gaming!"

