# Tyrian Reborn 🚀

A modern tribute to the classic space shooter Tyrian 2000, built with HTML5 Canvas and JavaScript.

## 🎮 [Play Live Demo](https://yourusername.github.io/gog-the-log/)

> **Note:** Replace `yourusername` with your actual GitHub username in the URL above.

## Features

- **Classic Space Shooter Gameplay**: Vertical scrolling action with enemies, power-ups, and multiple weapon types
- **Multiple Enemy Types**: 
  - Basic enemies with simple movement patterns
  - Fast enemies with erratic movement
  - Heavy enemies with more health and firepower
- **Weapon System**: Upgradeable weapons from single shot to spread patterns
- **Power-ups**: Weapon upgrades and health restoration items
- **Particle Effects**: Explosions and visual feedback
- **Progressive Difficulty**: Enemies spawn faster as you advance
- **Retro Aesthetics**: Green terminal-style UI with classic space shooter visuals

## Controls

- **Arrow Keys** or **WASD**: Move your ship
- **Space** or **Z**: Shoot primary weapon
- **P**: Pause/unpause the game

## Game Mechanics

### Scoring
- Basic Enemy: 100 points
- Fast Enemy: 150 points  
- Heavy Enemy: 300 points
- Level up every 1000 points

### Health System
- Start with 100 health
- Collision with enemies or bullets reduces health
- Health power-ups restore 30 health
- Game over when health reaches 0

### Weapon Upgrades
- **Level 1**: Single pulse cannon
- **Level 2**: Twin blasters (dual shot)
- **Level 3**: Spread shot (triple shot pattern)

## Technical Details

- Built with vanilla JavaScript and HTML5 Canvas
- 60 FPS game loop with delta time calculations
- Collision detection system
- Particle system for visual effects
- Responsive design that works on different screen sizes

## Getting Started

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. Click "START GAME" or press Space to begin
4. Enjoy the retro space shooting action!

## Browser Compatibility

Works in all modern browsers that support HTML5 Canvas:
- Chrome 4+
- Firefox 2+
- Safari 3.1+
- Edge (all versions)
- Opera 9+

## Future Enhancements

Potential features for future versions:
- Sound effects and background music
- More enemy types and boss battles
- Multiple levels with different backgrounds
- Local high score storage
- Mobile touch controls
- Multiplayer support

## Credits

Inspired by the classic Tyrian 2000 by Epic MegaGames. This is a fan tribute created for educational and entertainment purposes.

## 🚀 Deployment to GitHub Pages

### Automatic Deployment (Recommended)

This project is configured for automatic deployment to GitHub Pages using GitHub Actions:

1. **Fork or clone this repository** to your GitHub account
2. **Go to your repository settings** on GitHub
3. **Navigate to Pages** in the left sidebar
4. **Set Source to "GitHub Actions"**
5. **Push any changes** to the `main` or `master` branch
6. **GitHub Actions will automatically build and deploy** your game
7. **Your game will be available** at `https://yourusername.github.io/repository-name/`

### Manual Deployment

If you prefer manual deployment:

1. Go to your repository **Settings → Pages**
2. Set **Source** to "Deploy from a branch"
3. Select **Branch: main** (or master) and **/ (root)**
4. Click **Save**
5. Your site will be available at `https://yourusername.github.io/repository-name/`

### Custom Domain (Optional)

To use a custom domain:

1. **Edit the `CNAME` file** and replace the commented line with your domain
2. **Configure your domain's DNS** to point to GitHub Pages
3. **Enable "Enforce HTTPS"** in repository settings

### Local Development

To run locally during development:

```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)
npx http-server -p 8000 -o

# Using PHP (if installed)
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 📱 Progressive Web App (PWA)

This game includes PWA support:
- **Add to home screen** on mobile devices
- **Offline capable** (after first load)
- **Full-screen gaming experience**
- **Optimized for mobile and desktop**

## 🌐 Browser Compatibility

Tested and working on:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📊 Performance

- **60 FPS** smooth gameplay
- **Lightweight** - No external dependencies
- **Fast loading** - Optimized assets
- **Responsive** - Works on all screen sizes

## License

This project is open source and available under the MIT License.
