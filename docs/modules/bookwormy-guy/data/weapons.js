// Weapon System Definitions
// All 8 weapon types with base stats and upgrade levels

export const WEAPONS = {
    'pistol': {
        name: 'Pistol',
        baseFireRate: 300, // ms between shots
        baseDamage: 20,
        baseBulletSpeed: 500,
        baseBulletWidth: 4,
        baseBulletHeight: 8,
        bulletColor: '#ffffff',
        baseProjectiles: 1,
        upgrades: [
            // Level 2
            { fireRate: 1.25, damage: 1.20, projectiles: 1 },
            // Level 3
            { fireRate: 1.50, damage: 1.40, projectiles: 1 },
            // Level 4
            { fireRate: 1.75, damage: 1.60, projectiles: 1 },
            // Level 5
            { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'piercing', pierceCount: 2 }
        ]
    },
    'machinegun': {
        name: 'Machine Gun',
        baseFireRate: 150,
        baseDamage: 15,
        baseBulletSpeed: 600,
        baseBulletWidth: 3,
        baseBulletHeight: 6,
        bulletColor: '#ffff00',
        baseProjectiles: 1,
        upgrades: [
            { fireRate: 1.25, damage: 1.20, projectiles: 1 },
            { fireRate: 1.50, damage: 1.40, projectiles: 1 },
            { fireRate: 1.75, damage: 1.60, projectiles: 1 },
            { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'rapidFire' }
        ]
    },
    'bazooka': {
        name: 'Bazooka',
        baseFireRate: 800,
        baseDamage: 80,
        baseBulletSpeed: 400,
        baseBulletWidth: 12,
        baseBulletHeight: 12,
        bulletColor: '#ff4400',
        explosionRadius: 40,
        baseProjectiles: 1,
        upgrades: [
            { fireRate: 1.25, damage: 1.20, projectiles: 1 },
            { fireRate: 1.50, damage: 1.40, projectiles: 1 },
            { fireRate: 1.75, damage: 1.60, projectiles: 1 },
            { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'chainExplosion' }
        ]
    },
    'sniper': {
        name: 'Sniper Rifle',
        baseFireRate: 1000,
        baseDamage: 100,
        baseBulletSpeed: 800,
        baseBulletWidth: 2,
        baseBulletHeight: 20,
        bulletColor: '#00ffff',
        baseProjectiles: 1,
        upgrades: [
            { fireRate: 1.25, damage: 1.20, projectiles: 1 },
            { fireRate: 1.50, damage: 1.40, projectiles: 1 },
            { fireRate: 1.75, damage: 1.60, projectiles: 1 },
            { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'critical', criticalChance: 0.5 }
        ]
    },
    'glock': {
        name: 'Glock',
        baseFireRate: 250,
        baseDamage: 25,
        baseBulletSpeed: 550,
        baseBulletWidth: 4,
        baseBulletHeight: 7,
        bulletColor: '#cccccc',
        baseProjectiles: 1,
        upgrades: [
            { fireRate: 1.25, damage: 1.20, projectiles: 1 },
            { fireRate: 1.50, damage: 1.40, projectiles: 1 },
            { fireRate: 1.75, damage: 1.60, projectiles: 1 },
            { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'doubleTap' }
        ]
    },
    'ak47': {
        name: 'AK-47',
        baseFireRate: 200,
        baseDamage: 30,
        baseBulletSpeed: 580,
        baseBulletWidth: 4,
        baseBulletHeight: 8,
        bulletColor: '#8B4513',
        baseProjectiles: 1,
        upgrades: [
            { fireRate: 1.25, damage: 1.20, projectiles: 1 },
            { fireRate: 1.50, damage: 1.40, projectiles: 1 },
            { fireRate: 1.75, damage: 1.60, projectiles: 1 },
            { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'burst', burstCount: 3 }
        ]
    },
    'shotgun': {
        name: 'Shotgun',
        baseFireRate: 600,
        baseDamage: 40,
        baseBulletSpeed: 450,
        baseBulletWidth: 3,
        baseBulletHeight: 5,
        bulletColor: '#00ff00',
        baseProjectiles: 5,
        upgrades: [
            { fireRate: 1.25, damage: 1.20, projectiles: 5 },
            { fireRate: 1.50, damage: 1.40, projectiles: 5 },
            { fireRate: 1.75, damage: 1.60, projectiles: 6 },
            { fireRate: 2.00, damage: 1.80, projectiles: 7, special: 'wideSpread' }
        ]
    },
    'laser': {
        name: 'Laser Rifle',
        baseFireRate: 400,
        baseDamage: 50,
        baseBulletSpeed: 1000, // Instant beam, but use high speed for rendering
        baseBulletWidth: 3,
        baseBulletHeight: 30,
        bulletColor: '#ff00ff',
        beamDuration: 200, // ms
        baseProjectiles: 1,
        upgrades: [
            { fireRate: 1.25, damage: 1.20, projectiles: 1 },
            { fireRate: 1.50, damage: 1.40, projectiles: 1 },
            { fireRate: 1.75, damage: 1.60, projectiles: 1 },
            { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'extendedBeam', beamDuration: 400, piercing: true }
        ]
    }
};

