# 🚀 GitHub Pages Deployment Guide

This guide will help you deploy your Tyrian Reborn game to GitHub Pages.

## Quick Start (5 minutes)

### Step 1: Prepare Your Repository

1. **Create a new repository** on GitHub (or use an existing one)
2. **Clone this project** to your local machine
3. **Push the code** to your GitHub repository

```bash
git init
git add .
git commit -m "Initial commit: Tyrian Reborn game"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/YOURREPOSITORY.git
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (in the repository menu)
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **"GitHub Actions"**
5. The deployment will start automatically!

### Step 3: Access Your Game

Your game will be available at:
```
https://YOURUSERNAME.github.io/YOURREPOSITORY/
```

## Alternative: Manual Deployment

If you prefer not to use GitHub Actions:

1. Go to **Settings → Pages**
2. Set **Source** to **"Deploy from a branch"**
3. Select **Branch: main** and **/ (root)**
4. Click **Save**

## Customization

### Update URLs in Your Files

Replace the placeholder URLs in these files with your actual GitHub username and repository name:

1. **`index.html`** - Update Open Graph and Twitter meta tags
2. **`README.md`** - Update the live demo link
3. **`package.json`** - Update repository and homepage URLs

### Custom Domain (Optional)

To use your own domain:

1. **Edit `CNAME` file**:
   ```
   yourdomain.com
   ```

2. **Configure DNS** with your domain provider:
   - Add a CNAME record pointing to `yourusername.github.io`
   - Or add A records pointing to GitHub's IP addresses

3. **Enable HTTPS** in repository settings

## Troubleshooting

### Common Issues

**❌ 404 Error**
- Check that your repository is public
- Verify the GitHub Pages source is set correctly
- Wait a few minutes for deployment to complete

**❌ Game Not Loading**
- Check browser console for errors
- Ensure all file paths are correct (case-sensitive)
- Verify the `.nojekyll` file exists

**❌ GitHub Actions Failing**
- Check the Actions tab for error details
- Ensure your repository has Pages enabled
- Verify the workflow file syntax

### Performance Tips

- **Enable compression** in your web server
- **Use a CDN** for better global performance
- **Monitor Core Web Vitals** with Google PageSpeed Insights

## Advanced Configuration

### Environment Variables

You can set environment-specific configurations:

```javascript
const config = {
  production: window.location.hostname !== 'localhost',
  baseUrl: window.location.origin,
  version: '1.0.0'
};
```

### Analytics Integration

Add Google Analytics or other tracking:

```html
<!-- Add to index.html head section -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## Security

- **Never commit sensitive data** (API keys, passwords)
- **Use environment variables** for configuration
- **Enable branch protection** for production branches
- **Review pull requests** before merging

## Monitoring

Monitor your game's performance:

- **GitHub Pages usage** in repository insights
- **Google Analytics** for user behavior
- **Browser console** for JavaScript errors
- **Lighthouse** for performance audits

## Support

If you encounter issues:

1. Check the [GitHub Pages documentation](https://docs.github.com/en/pages)
2. Review the [GitHub Actions documentation](https://docs.github.com/en/actions)
3. Search existing issues in this repository
4. Create a new issue with detailed information

---

**Happy Gaming! 🎮**

