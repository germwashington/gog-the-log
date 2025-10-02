@echo off
REM Tyrian Reborn - GitHub Pages Deployment Script (Windows)
REM This script helps automate the deployment process

echo 🚀 Tyrian Reborn - GitHub Pages Deployment
echo ==========================================

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Initializing...
    git init
    git branch -M main
)

REM Check for uncommitted changes
git status --porcelain > temp_status.txt
for /f %%i in ("temp_status.txt") do set size=%%~zi
del temp_status.txt

if %size% gtr 0 (
    echo 📝 Found uncommitted changes. Committing...
    git add .
    set /p commit_msg="Enter commit message (or press Enter for default): "
    if "%commit_msg%"=="" set commit_msg=Update game files for deployment
    git commit -m "%commit_msg%"
) else (
    echo ✅ No uncommitted changes found.
)

REM Check if remote origin exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ❌ No remote origin found.
    echo Please add your GitHub repository as origin:
    echo git remote add origin https://github.com/YOURUSERNAME/YOURREPOSITORY.git
    pause
    exit /b 1
)

REM Push to GitHub
echo 📤 Pushing to GitHub...
git push -u origin main

echo.
echo ✅ Deployment initiated!
echo.
echo Next steps:
echo 1. Go to your GitHub repository
echo 2. Navigate to Settings → Pages
echo 3. Set Source to 'GitHub Actions'
echo 4. Wait for deployment to complete
echo.
echo Your game will be available at:
echo https://YOURUSERNAME.github.io/YOURREPOSITORY/
echo.
echo 🎮 Happy gaming!
pause

