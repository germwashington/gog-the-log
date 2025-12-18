// Bookwormy Guy - Central Data Store
// Module 5: Database and configuration store

import { ENEMY_TYPES } from './bookwormy-guy/data/enemies.js';
import { WEAPONS } from './bookwormy-guy/data/weapons.js';
import { LEVEL_CONFIGS } from './bookwormy-guy/data/levels.js';
import { STAGE_CONFIGS } from './bookwormy-guy/data/stages.js';
import { VISUAL_DATA } from './bookwormy-guy/data/visuals.js';
import { GAME_CONFIG } from './bookwormy-guy/data/config.js';

class BookwormyGuy {
    constructor(config = {}) {
        this.config = config;
    }
    
    // Enemy data
    getEnemyType(type) {
        return ENEMY_TYPES[type] || null;
    }
    
    getEnemyTypes() {
        return Object.keys(ENEMY_TYPES);
    }
    
    getMovementPattern(patternName) {
        // Movement patterns are defined in enemy types
        // Return pattern name for lookup
        return patternName;
    }
    
    getAttackPattern(patternName) {
        // Attack patterns are defined in enemy types
        // Return pattern name for lookup
        return patternName;
    }
    
    // Player data
    getPlayerBaseStats() {
        return {
            baseSpeed: GAME_CONFIG.PLAYER_BASE_SPEED,
            baseHealth: GAME_CONFIG.PLAYER_BASE_HEALTH,
            maxHealth: GAME_CONFIG.PLAYER_MAX_HEALTH,
            collectionRange: GAME_CONFIG.COLLECTION_RANGE
        };
    }
    
    getUpgradeDefinitions() {
        return GAME_CONFIG.STAT_BOOSTS;
    }
    
    // Weapon data
    getWeapon(weaponType, level) {
        const weapon = WEAPONS[weaponType];
        if (!weapon) return null;
        
        // Calculate stats based on level
        if (level === 1) {
            return {
                name: weapon.name,
                fireRate: weapon.baseFireRate,
                damage: weapon.baseDamage,
                bulletSpeed: weapon.baseBulletSpeed,
                bulletWidth: weapon.baseBulletWidth,
                bulletHeight: weapon.baseBulletHeight,
                bulletColor: weapon.bulletColor,
                projectiles: weapon.baseProjectiles || 1,
                level: 1
            };
        }
        
        // Apply upgrades for levels 2-5
        const upgrade = weapon.upgrades[level - 2];
        if (!upgrade) return null;
        
        return {
            name: weapon.name,
            fireRate: weapon.baseFireRate / upgrade.fireRate,
            damage: weapon.baseDamage * upgrade.damage,
            bulletSpeed: weapon.baseBulletSpeed,
            bulletWidth: weapon.baseBulletWidth,
            bulletHeight: weapon.baseBulletHeight,
            bulletColor: weapon.bulletColor,
            projectiles: upgrade.projectiles || weapon.baseProjectiles || 1,
            special: upgrade.special || null,
            level: level
        };
    }
    
    getWeaponTypes() {
        return Object.keys(WEAPONS);
    }
    
    getWeaponVisualData(weaponType) {
        const weapon = WEAPONS[weaponType];
        if (!weapon) return null;
        
        return {
            name: weapon.name,
            bulletColor: weapon.bulletColor,
            bulletWidth: weapon.baseBulletWidth,
            bulletHeight: weapon.baseBulletHeight
        };
    }
    
    // Level & stage data
    getLevelConfig(stage, level) {
        const levelKey = `${stage}-${level}`;
        return LEVEL_CONFIGS[levelKey] || null;
    }
    
    getStageConfig(stageNumber) {
        return STAGE_CONFIGS[stageNumber] || STAGE_CONFIGS[1];
    }
    
    getBossConfig(bossType) {
        // Boss configs will be added later, placeholder for now
        const bossConfigs = {
            'Stage1_Boss': {
                health: 500,
                width: 80,
                height: 80,
                points: 1000,
                shardDrops: 3,
                speed: 50,
                attackRate: 2000,
                attackType: 'spread3'
            },
            'Stage2_Boss': {
                health: 750,
                width: 90,
                height: 90,
                points: 1500,
                shardDrops: 4,
                speed: 80,
                attackRate: 1500,
                attackType: 'spread5'
            },
            'Stage3_Boss': {
                health: 1000,
                width: 100,
                height: 100,
                points: 2000,
                shardDrops: 5,
                speed: 60,
                attackRate: 1200,
                attackType: 'spread7'
            },
            'Stage4_Boss': {
                health: 1500,
                width: 110,
                height: 110,
                points: 3000,
                shardDrops: 6,
                speed: 100,
                attackRate: 1000,
                attackType: 'spread9'
            },
            'Stage5_FinalBoss': {
                health: 2500,
                width: 120,
                height: 120,
                points: 5000,
                shardDrops: 10,
                speed: 70,
                attackRate: 800,
                attackType: 'spread12'
            }
        };
        
        return bossConfigs[bossType] || null;
    }
    
    // Visual data
    getColorPalette(stage) {
        return VISUAL_DATA.colorPalettes[stage] || VISUAL_DATA.colorPalettes[1];
    }
    
    getParticleEffect(effectName) {
        return VISUAL_DATA.particleEffects[effectName] || null;
    }
    
    getAnimation(animationName) {
        // Animations will be defined here when needed
        return null;
    }
    
    // Audio data (placeholder)
    getSoundEffect(soundName) {
        // Sound effects will be defined here when needed
        return { name: soundName };
    }
    
    getMusicTrack(trackName) {
        // Music tracks will be defined here when needed
        return { name: trackName };
    }
    
    // Game configuration
    getGameConfig() {
        return GAME_CONFIG;
    }
    
    getConstant(name) {
        return GAME_CONFIG[name] || null;
    }
    
    // Data updates (for runtime modifications)
    updateLevelConfig(stage, level, config) {
        const levelKey = `${stage}-${level}`;
        if (LEVEL_CONFIGS[levelKey]) {
            Object.assign(LEVEL_CONFIGS[levelKey], config);
        }
    }
    
    updateEnemyType(type, data) {
        if (ENEMY_TYPES[type]) {
            Object.assign(ENEMY_TYPES[type], data);
        }
    }
}

export { BookwormyGuy };
