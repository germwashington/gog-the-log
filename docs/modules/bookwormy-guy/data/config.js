// Game Configuration
// Constants, balance values, and game settings

export const GAME_CONFIG = {
    // Screen dimensions
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // Player constants
    PLAYER_BASE_SPEED: 300, // pixels per second
    PLAYER_BASE_HEALTH: 100,
    PLAYER_MAX_HEALTH: 100,
    COLLECTION_RANGE: 30, // pixels
    
    // Shard system
    SHARDS_NEEDED_PER_LEVEL: 10,
    SHARD_FALL_SPEED_MIN: 150,
    SHARD_FALL_SPEED_MAX: 200,
    SHARD_SPAWN_INTERVAL_MIN: 2000, // ms
    SHARD_SPAWN_INTERVAL_MAX: 3000, // ms
    SHARD_ENEMY_CARRY_CHANCE: 0.3, // 30%
    
    // Weapon drops
    WEAPON_DROP_FALL_SPEED: 200,
    WEAPON_DROP_COLLECTION_RANGE: 40,
    WEAPON_DROP_CHANCE_AFTER_LEVEL_3: 0.3, // 30% per level
    WEAPON_DROP_GUARANTEED_BY_LEVEL: 4,
    
    // Enemy limits
    MAX_ENEMIES_ON_SCREEN: 20,
    MAX_PARTICLES: 200,
    
    // Level progression
    TOTAL_STAGES: 5,
    LEVELS_PER_STAGE: 5,
    
    // Performance
    TARGET_FPS: 60,
    
    // Stat boost ranges (on level up)
    STAT_BOOSTS: {
        damage: { min: 5, max: 15, unit: '%' },
        speed: { min: 5, max: 15, unit: '%' },
        fireRate: { min: 5, max: 15, unit: '%' },
        health: { min: 10, max: 30, unit: '' },
        collectionRange: { min: 5, max: 15, unit: 'px' }
    },
    
    // Easter egg
    EASTER_EGG_SHARD_COUNT: 67,
    EASTER_EGG_SEQUENCE: '6-7'
};

