// Visual Data
// Colors, particle effects, animations, and visual constants

export const VISUAL_DATA = {
    // Color palettes per stage (can have variants)
    colorPalettes: {
        1: { // Deep Space
            primary: '#000428',
            secondary: '#004e92',
            accent: '#ffffff',
            nebula: 'rgba(100, 50, 200, 0.3)'
        },
        2: { // Asteroid Field
            primary: '#1a1a2e',
            secondary: '#16213e',
            accent: '#cccccc',
            nebula: 'rgba(80, 60, 40, 0.4)'
        },
        3: { // Nebula Zone
            primary: '#2d1b69',
            secondary: '#4a2c7a',
            accent: '#ff88ff',
            nebula: 'rgba(255, 100, 200, 0.5)'
        },
        4: { // Void Sector
            primary: '#0a0a1a',
            secondary: '#1a1a2a',
            accent: '#00ffff',
            nebula: 'rgba(0, 255, 255, 0.3)'
        },
        5: { // Final Confrontation
            primary: '#2d0a1a',
            secondary: '#4d1a2a',
            accent: '#ff4444',
            nebula: 'rgba(255, 100, 0, 0.5)'
        }
    },
    
    // Particle effects
    particleEffects: {
        explosion: {
            count: 10,
            colors: ['#ff4444', '#ff8844', '#ffff44'],
            size: { min: 2, max: 6 },
            speed: { min: 50, max: 200 },
            life: { min: 0.3, max: 0.8 }
        },
        shardCollection: {
            count: 20,
            colors: ['#00ffff', '#00DDFF', '#ffffff'],
            size: { min: 1, max: 4 },
            speed: { min: 30, max: 150 },
            life: { min: 0.2, max: 0.5 }
        },
        levelComplete: {
            count: 50,
            colors: ['#00ff00', '#00ffff', '#ffffff'],
            size: { min: 2, max: 8 },
            speed: { min: 100, max: 300 },
            life: { min: 0.5, max: 1.5 }
        }
    },
    
    // Object sizes
    sizes: {
        player: { width: 40, height: 40 },
        shard: { width: 12, height: 12 },
        weaponDrop: { width: 30, height: 30 }
    },
    
    // Collection ranges
    collectionRanges: {
        shard: 30,
        weapon: 40
    }
};

