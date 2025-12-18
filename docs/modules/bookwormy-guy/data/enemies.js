// Enemy Type Definitions
// All enemy types with their base stats and properties

export const ENEMY_TYPES = {
    'basic': {
        health: 30,
        baseSpeed: 100,
        width: 30,
        height: 30,
        points: 100,
        fireRate: 2000, // ms between shots
        canShoot: false, // Can shoot if level 3+
        splits: true, // Splits in level 4+
        movementPattern: 'straight'
    },
    'scout': {
        health: 10,
        baseSpeed: 120,
        width: 20,
        height: 20,
        points: 50,
        fireRate: 1500,
        canShoot: false,
        splits: true,
        movementPattern: 'straight'
    },
    'zigzag': {
        health: 25,
        baseSpeed: 150,
        width: 30,
        height: 30,
        points: 180,
        fireRate: 1000,
        canShoot: true,
        splits: true,
        movementPattern: 'zigzag'
    },
    'fast': {
        health: 15,
        baseSpeed: 250,
        width: 25,
        height: 25,
        points: 150,
        fireRate: 800,
        canShoot: true,
        splits: true,
        movementPattern: 'straight'
    },
    'fighter': {
        health: 20,
        baseSpeed: 150,
        width: 25,
        height: 25,
        points: 100,
        fireRate: 1000,
        canShoot: true,
        splits: false,
        movementPattern: 'straight'
    },
    'sidewinder': {
        health: 20,
        baseSpeed: 200,
        width: 28,
        height: 28,
        points: 160,
        fireRate: 700,
        canShoot: true,
        splits: false,
        movementPattern: 'sidewinder'
    },
    'hunter': {
        health: 40,
        baseSpeed: 180,
        width: 35,
        height: 35,
        points: 250,
        fireRate: 1200,
        canShoot: true,
        splits: true,
        movementPattern: 'tracking',
        bulletType: 'homing'
    },
    'bomber': {
        health: 80,
        baseSpeed: 80,
        width: 45,
        height: 45,
        points: 350,
        fireRate: 2000,
        canShoot: true,
        splits: true,
        movementPattern: 'straight',
        bulletType: 'bomb',
        bulletCount: 3
    },
    'heavy': {
        health: 120,
        baseSpeed: 60,
        width: 50,
        height: 50,
        points: 400,
        fireRate: 600,
        canShoot: true,
        splits: false,
        movementPattern: 'straight',
        bulletType: 'heavy',
        bulletCount: 3
    },
    'spiral': {
        health: 35,
        baseSpeed: 120,
        width: 32,
        height: 32,
        points: 220,
        fireRate: 900,
        canShoot: true,
        splits: false,
        movementPattern: 'spiral',
        bulletType: 'spiral',
        bulletCount: 3,
        radius: 50
    },
    'turret': {
        health: 70,
        baseSpeed: 0, // Stationary
        width: 34,
        height: 34,
        points: 300,
        fireRate: 1100,
        canShoot: true,
        splits: false,
        movementPattern: 'stationary',
        bulletType: 'homing'
    },
    'elite_hunter': {
        health: 80,
        baseSpeed: 220,
        width: 40,
        height: 40,
        points: 500,
        fireRate: 800,
        canShoot: true,
        splits: true,
        movementPattern: 'tracking',
        bulletType: 'homing',
        bulletCount: 2
    },
    'elite_bomber': {
        health: 150,
        baseSpeed: 100,
        width: 55,
        height: 55,
        points: 600,
        fireRate: 1500,
        canShoot: true,
        splits: true,
        movementPattern: 'straight',
        bulletType: 'bomb',
        bulletCount: 5
    },
    'elite_spiral': {
        health: 60,
        baseSpeed: 150,
        width: 38,
        height: 38,
        points: 450,
        fireRate: 600,
        canShoot: true,
        splits: false,
        movementPattern: 'spiral',
        bulletType: 'spiral',
        bulletCount: 5,
        radius: 60
    }
};

