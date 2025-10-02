# Tyrian Reborn

A modern tribute to the classic space shooter Tyrian 2000, built with HTML5 Canvas and JavaScript.

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

## License

This project is open source and available under the MIT License.
