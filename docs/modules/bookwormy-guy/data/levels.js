// Level Configurations
// All 25 levels (5 stages × 5 levels each)

export const LEVEL_CONFIGS = {
    '1-1': {
        enemyTypes: [
            { type: 'basic', weight: 100 }
        ],
        spawnRate: 3000, // ms (1 every 3 seconds)
        speed: 80,
        shootPercent: 0,
        split: false,
        splitTypes: []
    },
    '1-2': {
        enemyTypes: [
            { type: 'basic', weight: 80 },
            { type: 'scout', weight: 20 }
        ],
        spawnRate: 2500,
        speed: 90,
        shootPercent: 0,
        split: false,
        splitTypes: []
    },
    '1-3': {
        enemyTypes: [
            { type: 'basic', weight: 60 },
            { type: 'scout', weight: 30 },
            { type: 'zigzag', weight: 10 }
        ],
        spawnRate: 2000,
        speed: 100,
        shootPercent: 20,
        split: false,
        splitTypes: []
    },
    '1-4': {
        enemyTypes: [
            { type: 'basic', weight: 40 },
            { type: 'scout', weight: 30 },
            { type: 'zigzag', weight: 20 },
            { type: 'fast', weight: 10 }
        ],
        spawnRate: 1800,
        speed: 110,
        shootPercent: 30,
        split: true,
        splitTypes: ['scout', 'basic']
    },
    '1-5': {
        enemyTypes: [
            { type: 'basic', weight: 50 },
            { type: 'scout', weight: 30 },
            { type: 'zigzag', weight: 20 }
        ],
        spawnRate: 3000, // Reduced for boss
        speed: 110,
        shootPercent: 30,
        split: false,
        splitTypes: [],
        boss: 'Stage1_Boss'
    },
    '2-1': {
        enemyTypes: [
            { type: 'basic', weight: 50 },
            { type: 'zigzag', weight: 30 },
            { type: 'fast', weight: 20 }
        ],
        spawnRate: 2200,
        speed: 120,
        shootPercent: 25,
        split: false,
        splitTypes: []
    },
    '2-2': {
        enemyTypes: [
            { type: 'zigzag', weight: 40 },
            { type: 'fast', weight: 30 },
            { type: 'fighter', weight: 20 },
            { type: 'sidewinder', weight: 10 }
        ],
        spawnRate: 2000,
        speed: 130,
        shootPercent: 35,
        split: false,
        splitTypes: []
    },
    '2-3': {
        enemyTypes: [
            { type: 'zigzag', weight: 30 },
            { type: 'fast', weight: 25 },
            { type: 'fighter', weight: 25 },
            { type: 'sidewinder', weight: 20 }
        ],
        spawnRate: 1800,
        speed: 140,
        shootPercent: 40,
        split: false,
        splitTypes: []
    },
    '2-4': {
        enemyTypes: [
            { type: 'fast', weight: 30 },
            { type: 'fighter', weight: 25 },
            { type: 'sidewinder', weight: 25 },
            { type: 'hunter', weight: 20 }
        ],
        spawnRate: 1600,
        speed: 150,
        shootPercent: 45,
        split: true,
        splitTypes: ['zigzag', 'fast']
    },
    '2-5': {
        enemyTypes: [
            { type: 'zigzag', weight: 40 },
            { type: 'fast', weight: 30 },
            { type: 'fighter', weight: 30 }
        ],
        spawnRate: 3500, // Reduced for boss
        speed: 150,
        shootPercent: 45,
        split: false,
        splitTypes: [],
        boss: 'Stage2_Boss'
    },
    '3-1': {
        enemyTypes: [
            { type: 'fighter', weight: 40 },
            { type: 'sidewinder', weight: 30 },
            { type: 'hunter', weight: 25 },
            { type: 'bomber', weight: 5 }
        ],
        spawnRate: 1800,
        speed: 160,
        shootPercent: 50,
        split: false,
        splitTypes: []
    },
    '3-2': {
        enemyTypes: [
            { type: 'sidewinder', weight: 35 },
            { type: 'hunter', weight: 30 },
            { type: 'bomber', weight: 20 },
            { type: 'heavy', weight: 15 }
        ],
        spawnRate: 1600,
        speed: 170,
        shootPercent: 55,
        split: false,
        splitTypes: []
    },
    '3-3': {
        enemyTypes: [
            { type: 'hunter', weight: 30 },
            { type: 'bomber', weight: 25 },
            { type: 'heavy', weight: 25 },
            { type: 'spiral', weight: 20 }
        ],
        spawnRate: 1500,
        speed: 180,
        shootPercent: 60,
        split: false,
        splitTypes: []
    },
    '3-4': {
        enemyTypes: [
            { type: 'bomber', weight: 30 },
            { type: 'heavy', weight: 25 },
            { type: 'spiral', weight: 25 },
            { type: 'turret', weight: 20 }
        ],
        spawnRate: 1400,
        speed: 190,
        shootPercent: 65,
        split: true,
        splitTypes: ['hunter', 'bomber']
    },
    '3-5': {
        enemyTypes: [
            { type: 'hunter', weight: 40 },
            { type: 'bomber', weight: 30 },
            { type: 'heavy', weight: 30 }
        ],
        spawnRate: 4000, // Reduced for boss
        speed: 190,
        shootPercent: 65,
        split: false,
        splitTypes: [],
        boss: 'Stage3_Boss'
    },
    '4-1': {
        enemyTypes: [
            { type: 'heavy', weight: 35 },
            { type: 'spiral', weight: 30 },
            { type: 'turret', weight: 25 },
            { type: 'elite_hunter', weight: 10 }
        ],
        spawnRate: 1500,
        speed: 200,
        shootPercent: 70,
        split: false,
        splitTypes: []
    },
    '4-2': {
        enemyTypes: [
            { type: 'spiral', weight: 30 },
            { type: 'turret', weight: 30 },
            { type: 'elite_hunter', weight: 25 },
            { type: 'elite_bomber', weight: 15 }
        ],
        spawnRate: 1400,
        speed: 210,
        shootPercent: 75,
        split: false,
        splitTypes: []
    },
    '4-3': {
        enemyTypes: [
            { type: 'turret', weight: 30 },
            { type: 'elite_hunter', weight: 30 },
            { type: 'elite_bomber', weight: 25 },
            { type: 'elite_spiral', weight: 15 }
        ],
        spawnRate: 1300,
        speed: 220,
        shootPercent: 80,
        split: false,
        splitTypes: []
    },
    '4-4': {
        enemyTypes: [
            { type: 'elite_hunter', weight: 35 },
            { type: 'elite_bomber', weight: 30 },
            { type: 'elite_spiral', weight: 25 },
            { type: 'heavy', weight: 10 }
        ],
        spawnRate: 1200,
        speed: 230,
        shootPercent: 85,
        split: true,
        splitTypes: ['elite_hunter', 'elite_bomber']
    },
    '4-5': {
        enemyTypes: [
            { type: 'elite_hunter', weight: 40 },
            { type: 'elite_bomber', weight: 30 },
            { type: 'elite_spiral', weight: 30 }
        ],
        spawnRate: 4500, // Reduced for boss
        speed: 230,
        shootPercent: 85,
        split: false,
        splitTypes: [],
        boss: 'Stage4_Boss'
    },
    '5-1': {
        enemyTypes: [
            { type: 'elite_hunter', weight: 40 },
            { type: 'elite_bomber', weight: 35 },
            { type: 'elite_spiral', weight: 25 }
        ],
        spawnRate: 1200,
        speed: 240,
        shootPercent: 90,
        split: false,
        splitTypes: []
    },
    '5-2': {
        enemyTypes: [
            { type: 'elite_bomber', weight: 40 },
            { type: 'elite_spiral', weight: 35 },
            { type: 'elite_hunter', weight: 25 }
        ],
        spawnRate: 1100,
        speed: 250,
        shootPercent: 95,
        split: false,
        splitTypes: []
    },
    '5-3': {
        enemyTypes: [
            { type: 'elite_spiral', weight: 40 },
            { type: 'elite_hunter', weight: 35 },
            { type: 'elite_bomber', weight: 25 }
        ],
        spawnRate: 1000,
        speed: 260,
        shootPercent: 100, // All enemies shoot
        split: false,
        splitTypes: []
    },
    '5-4': {
        enemyTypes: [
            { type: 'elite_hunter', weight: 34 },
            { type: 'elite_bomber', weight: 33 },
            { type: 'elite_spiral', weight: 33 }
        ],
        spawnRate: 900,
        speed: 270,
        shootPercent: 100,
        split: true,
        splitTypes: ['elite_hunter', 'elite_bomber', 'elite_spiral']
    },
    '5-5': {
        enemyTypes: [
            { type: 'elite_hunter', weight: 40 },
            { type: 'elite_bomber', weight: 30 },
            { type: 'elite_spiral', weight: 30 }
        ],
        spawnRate: 5000, // Reduced for final boss
        speed: 270,
        shootPercent: 100,
        split: false,
        splitTypes: [],
        boss: 'Stage5_FinalBoss'
    }
};

