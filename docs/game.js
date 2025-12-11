// Energy Shard Collection Shooter - v2.0 Implementation
// Complete implementation based on 2.0 plan specifications

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'start'; // start, playing, levelComplete, stageTransition, bossFight, gameOver, victory
        this.score = 0;
        this.stage = 1;
        this.level = 1; // Level within stage (1-5)
        this.totalShardsCollected = 0;
        this.shardsCollectedThisLevel = 0;
        this.shardsNeeded = 10;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Level completion state
        this.levelCompleteTimer = 0;
        this.levelCompleteDuration = 2000; // 2 seconds
        this.showCheckmark = false;
        this.showLevelCompleteText = false;
        this.statBoostMessage = '';
        this.statBoostTimer = 0;
        
        // Stage transition state
        this.stageTransitionTimer = 0;
        this.stageTransitionDuration = 2000;
        this.stageTransitionText = '';
        this.stageTransitionAlpha = 0;
        
        // Game objects
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.energyShards = [];
        this.weaponDrops = [];
        this.particles = [];
        this.bosses = [];
        
        // Background elements
        this.stars = [];
        this.backgroundElements = [];
        this.currentBackground = null;
        
        // Input handling
        this.keys = {};
        this.keysPressed = {}; // Track single key presses
        
        // Spawn timers
        this.enemySpawnTimer = 0;
        this.shardSpawnTimer = 0;
        this.weaponDropTimer = 0;
        this.weaponDropLevelsSinceLast = 0;
        
        // Audio system
        this.audioEnabled = true;
        this.audioContext = null;
        
        // Easter egg
        this.easterEggTriggered = false;
        this.easterEggTimer = 0;
        this.easterEggSequence = '';
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createAudioContext();
        this.player = new Player(this.width / 2, this.height - 100);
        this.setupStage(1);
        this.gameLoop();
    }
    
    createAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.audioEnabled = false;
            console.log('Web Audio API not supported');
        }
    }
    
    playSound(type, frequency = 440, duration = 0.1) {
        if (!this.audioEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch (type) {
            case 'shardCollect':
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                duration = 0.2;
                break;
            case 'levelComplete':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                duration = 0.5;
                break;
            case 'weaponUpgrade':
                oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(700, this.audioContext.currentTime + 0.2);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                duration = 0.3;
                break;
            case 'weaponDrop':
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.3);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                duration = 0.4;
                break;
            case 'shoot':
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                break;
            case 'explosion':
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                duration = 0.3;
                break;
            case 'hit':
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                duration = 0.05;
                break;
            case 'bossSpawn':
                oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.8);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
                duration = 1.0;
                break;
            case 'bossDefeated':
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 1.2);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.2);
                duration = 1.5;
                break;
        }
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            this.keysPressed[e.code] = true;
            
            // Easter egg detection
            if (e.key >= '0' && e.key <= '9') {
                this.easterEggSequence += e.key;
                if (this.easterEggSequence.length > 3) {
                    this.easterEggSequence = this.easterEggSequence.slice(-3);
                }
                if (this.easterEggSequence === '67' || this.easterEggSequence.includes('6-7')) {
                    this.triggerEasterEgg();
                }
            }
            
            if (e.code === 'KeyP') {
                this.togglePause();
            }
            
            if (this.gameState === 'start' && e.code === 'Space') {
                this.startGame();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('muteButton').addEventListener('click', () => {
            this.toggleAudio();
        });
    }
    
    setupStage(stageNumber) {
        this.stage = stageNumber;
        this.level = 1;
        this.shardsCollectedThisLevel = 0;
        
        // Setup background based on stage
        const stageConfig = this.getStageConfig(stageNumber);
        this.currentBackground = stageConfig;
        
        // Create background elements
        this.createBackgroundElements(stageNumber);
        
        // Reset spawn timers
        this.enemySpawnTimer = 0;
        this.shardSpawnTimer = 0;
        this.weaponDropLevelsSinceLast = 0;
    }
    
    getStageConfig(stageNumber) {
        const configs = {
            1: {
                name: 'Deep Space',
                baseColor: '#000428',
                starColor: '#ffffff',
                nebulaColor: 'rgba(100, 50, 200, 0.3)',
                parallaxLayers: 3
            },
            2: {
                name: 'Asteroid Field',
                baseColor: '#1a1a2e',
                starColor: '#cccccc',
                nebulaColor: 'rgba(80, 60, 40, 0.4)',
                parallaxLayers: 2
            },
            3: {
                name: 'Nebula Zone',
                baseColor: '#2d1b69',
                starColor: '#ff88ff',
                nebulaColor: 'rgba(255, 100, 200, 0.5)',
                parallaxLayers: 3
            },
            4: {
                name: 'Void Sector',
                baseColor: '#0a0a1a',
                starColor: '#00ffff',
                nebulaColor: 'rgba(0, 255, 255, 0.3)',
                parallaxLayers: 2
            },
            5: {
                name: 'Final Confrontation',
                baseColor: '#2d0a1a',
                starColor: '#ff4444',
                nebulaColor: 'rgba(255, 100, 0, 0.5)',
                parallaxLayers: 3
            }
        };
        return configs[stageNumber] || configs[1];
    }
    
    createBackgroundElements(stageNumber) {
        this.stars = [];
        this.backgroundElements = [];
        
        const config = this.getStageConfig(stageNumber);
        const starCount = [60, 45, 30]; // Far, mid, near layers
        
        for (let layer = 0; layer < config.parallaxLayers; layer++) {
            for (let i = 0; i < starCount[layer] || 30; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    speed: (20 + layer * 20) + Math.random() * 20,
                    brightness: Math.random() * 0.5 + 0.2,
                    size: 1 + layer,
                    layer: layer
                });
            }
        }
        
        // Add stage-specific elements
        if (stageNumber === 2) {
            // Asteroids
            for (let i = 0; i < 10; i++) {
                this.backgroundElements.push({
                    type: 'asteroid',
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: 20 + Math.random() * 30,
                    speed: 30 + Math.random() * 20,
                    rotation: Math.random() * Math.PI * 2
                });
            }
        } else if (stageNumber === 3) {
            // Nebula clouds
            for (let i = 0; i < 5; i++) {
                this.backgroundElements.push({
                    type: 'nebula',
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: 100 + Math.random() * 150,
                    speed: 10 + Math.random() * 10,
                    alpha: 0.2 + Math.random() * 0.3
                });
            }
        } else if (stageNumber === 4) {
            // Energy rifts
            for (let i = 0; i < 8; i++) {
                this.backgroundElements.push({
                    type: 'rift',
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    size: 50 + Math.random() * 80,
                    speed: 15 + Math.random() * 15,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }
    }
    
    getLevelConfig() {
        const levelKey = `${this.stage}-${this.level}`;
        const configs = {
            '1-1': { enemyTypes: [{type: 'basic', weight: 100}], spawnRate: 3000, speed: 80, shootPercent: 0, split: false },
            '1-2': { enemyTypes: [{type: 'basic', weight: 80}, {type: 'scout', weight: 20}], spawnRate: 2500, speed: 90, shootPercent: 0, split: false },
            '1-3': { enemyTypes: [{type: 'basic', weight: 60}, {type: 'scout', weight: 30}, {type: 'zigzag', weight: 10}], spawnRate: 2000, speed: 100, shootPercent: 20, split: false },
            '1-4': { enemyTypes: [{type: 'basic', weight: 40}, {type: 'scout', weight: 30}, {type: 'zigzag', weight: 20}, {type: 'fast', weight: 10}], spawnRate: 1800, speed: 110, shootPercent: 30, split: true, splitTypes: ['scout', 'basic'] },
            '1-5': { enemyTypes: [{type: 'basic', weight: 50}, {type: 'scout', weight: 30}, {type: 'zigzag', weight: 20}], spawnRate: 3000, speed: 110, shootPercent: 30, split: false, boss: 'Stage1_Boss' },
            '2-1': { enemyTypes: [{type: 'basic', weight: 50}, {type: 'zigzag', weight: 30}, {type: 'fast', weight: 20}], spawnRate: 2200, speed: 120, shootPercent: 25, split: false },
            '2-2': { enemyTypes: [{type: 'zigzag', weight: 40}, {type: 'fast', weight: 30}, {type: 'fighter', weight: 20}, {type: 'sidewinder', weight: 10}], spawnRate: 2000, speed: 130, shootPercent: 35, split: false },
            '2-3': { enemyTypes: [{type: 'zigzag', weight: 30}, {type: 'fast', weight: 25}, {type: 'fighter', weight: 25}, {type: 'sidewinder', weight: 20}], spawnRate: 1800, speed: 140, shootPercent: 40, split: false },
            '2-4': { enemyTypes: [{type: 'fast', weight: 30}, {type: 'fighter', weight: 25}, {type: 'sidewinder', weight: 25}, {type: 'hunter', weight: 20}], spawnRate: 1600, speed: 150, shootPercent: 45, split: true, splitTypes: ['zigzag', 'fast'] },
            '2-5': { enemyTypes: [{type: 'zigzag', weight: 40}, {type: 'fast', weight: 30}, {type: 'fighter', weight: 30}], spawnRate: 3500, speed: 150, shootPercent: 45, split: false, boss: 'Stage2_Boss' },
            '3-1': { enemyTypes: [{type: 'fighter', weight: 40}, {type: 'sidewinder', weight: 30}, {type: 'hunter', weight: 25}, {type: 'bomber', weight: 5}], spawnRate: 1800, speed: 160, shootPercent: 50, split: false },
            '3-2': { enemyTypes: [{type: 'sidewinder', weight: 35}, {type: 'hunter', weight: 30}, {type: 'bomber', weight: 20}, {type: 'heavy', weight: 15}], spawnRate: 1600, speed: 170, shootPercent: 55, split: false },
            '3-3': { enemyTypes: [{type: 'hunter', weight: 30}, {type: 'bomber', weight: 25}, {type: 'heavy', weight: 25}, {type: 'spiral', weight: 20}], spawnRate: 1500, speed: 180, shootPercent: 60, split: false },
            '3-4': { enemyTypes: [{type: 'bomber', weight: 30}, {type: 'heavy', weight: 25}, {type: 'spiral', weight: 25}, {type: 'turret', weight: 20}], spawnRate: 1400, speed: 190, shootPercent: 65, split: true, splitTypes: ['hunter', 'bomber'] },
            '3-5': { enemyTypes: [{type: 'hunter', weight: 40}, {type: 'bomber', weight: 30}, {type: 'heavy', weight: 30}], spawnRate: 4000, speed: 190, shootPercent: 65, split: false, boss: 'Stage3_Boss' },
            '4-1': { enemyTypes: [{type: 'heavy', weight: 35}, {type: 'spiral', weight: 30}, {type: 'turret', weight: 25}, {type: 'elite_hunter', weight: 10}], spawnRate: 1500, speed: 200, shootPercent: 70, split: false },
            '4-2': { enemyTypes: [{type: 'spiral', weight: 30}, {type: 'turret', weight: 30}, {type: 'elite_hunter', weight: 25}, {type: 'elite_bomber', weight: 15}], spawnRate: 1400, speed: 210, shootPercent: 75, split: false },
            '4-3': { enemyTypes: [{type: 'turret', weight: 30}, {type: 'elite_hunter', weight: 30}, {type: 'elite_bomber', weight: 25}, {type: 'elite_spiral', weight: 15}], spawnRate: 1300, speed: 220, shootPercent: 80, split: false },
            '4-4': { enemyTypes: [{type: 'elite_hunter', weight: 35}, {type: 'elite_bomber', weight: 30}, {type: 'elite_spiral', weight: 25}, {type: 'heavy', weight: 10}], spawnRate: 1200, speed: 230, shootPercent: 85, split: true, splitTypes: ['elite_hunter', 'elite_bomber'] },
            '4-5': { enemyTypes: [{type: 'elite_hunter', weight: 40}, {type: 'elite_bomber', weight: 30}, {type: 'elite_spiral', weight: 30}], spawnRate: 4500, speed: 230, shootPercent: 85, split: false, boss: 'Stage4_Boss' },
            '5-1': { enemyTypes: [{type: 'elite_hunter', weight: 40}, {type: 'elite_bomber', weight: 35}, {type: 'elite_spiral', weight: 25}], spawnRate: 1200, speed: 240, shootPercent: 90, split: false },
            '5-2': { enemyTypes: [{type: 'elite_bomber', weight: 40}, {type: 'elite_spiral', weight: 35}, {type: 'elite_hunter', weight: 25}], spawnRate: 1100, speed: 250, shootPercent: 95, split: false },
            '5-3': { enemyTypes: [{type: 'elite_spiral', weight: 40}, {type: 'elite_hunter', weight: 35}, {type: 'elite_bomber', weight: 25}], spawnRate: 1000, speed: 260, shootPercent: 100, split: false },
            '5-4': { enemyTypes: [{type: 'elite_hunter', weight: 34}, {type: 'elite_bomber', weight: 33}, {type: 'elite_spiral', weight: 33}], spawnRate: 900, speed: 270, shootPercent: 100, split: true, splitTypes: ['elite_hunter', 'elite_bomber', 'elite_spiral'] },
            '5-5': { enemyTypes: [{type: 'elite_hunter', weight: 40}, {type: 'elite_bomber', weight: 30}, {type: 'elite_spiral', weight: 30}], spawnRate: 5000, speed: 270, shootPercent: 100, split: false, boss: 'Stage5_FinalBoss' }
        };
        
        return configs[levelKey] || configs['1-1'];
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.stage = 1;
        this.level = 1;
        this.totalShardsCollected = 0;
        this.shardsCollectedThisLevel = 0;
        this.bullets = [];
        this.enemies = [];
        this.energyShards = [];
        this.weaponDrops = [];
        this.particles = [];
        this.bosses = [];
        this.player = new Player(this.width / 2, this.height - 100);
        this.setupStage(1);
        this.enemySpawnTimer = 0;
        this.shardSpawnTimer = 0;
        this.weaponDropLevelsSinceLast = 0;
        this.easterEggTriggered = false;
        this.easterEggSequence = '';
        
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.updateUI();
    }
    
    restartGame() {
        this.startGame();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseScreen').classList.remove('hidden');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseScreen').classList.add('hidden');
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        const muteButton = document.getElementById('muteButton');
        if (this.audioEnabled) {
            muteButton.textContent = '🔊';
            muteButton.classList.remove('muted');
        } else {
            muteButton.textContent = '🔇';
            muteButton.classList.add('muted');
        }
    }
    
    completeLevel() {
        this.gameState = 'levelComplete';
        this.levelCompleteTimer = 0;
        this.showCheckmark = true;
        this.showLevelCompleteText = true;
        
        // Apply random stat boost
        this.applyRandomStatBoost();
        
        // Play level complete sound
        this.playSound('levelComplete');
        
        // Freeze gameplay briefly
        setTimeout(() => {
            // Check if we need to transition to next stage
            if (this.level >= 5) {
                // Move to next stage
                if (this.stage < 5) {
                    this.transitionToStage(this.stage + 1);
                } else {
                    // Game complete!
                    this.gameState = 'victory';
                    // Could show victory screen here
                }
            } else {
                // Move to next level in same stage
                this.level++;
                this.shardsCollectedThisLevel = 0;
                this.gameState = 'playing';
                
                // Spawn boss if this is level 5
                const levelConfig = this.getLevelConfig();
                if (levelConfig.boss) {
                    this.spawnBoss(levelConfig.boss);
                }
            }
        }, 500); // 0.5 second freeze
    }
    
    transitionToStage(newStage) {
        this.gameState = 'stageTransition';
        this.stageTransitionTimer = 0;
        this.stageTransitionAlpha = 0;
        const stageConfig = this.getStageConfig(newStage);
        this.stageTransitionText = `STAGE ${newStage} - ${stageConfig.name.toUpperCase()}`;
        
        setTimeout(() => {
            this.setupStage(newStage);
            this.level = 1;
            this.shardsCollectedThisLevel = 0;
            this.gameState = 'playing';
            
            // Check for major boss
            if (newStage === 3) {
                // Major Boss 1 after Stage 2
                this.spawnMajorBoss('Asteroid_Crusher');
            } else if (newStage === 5) {
                // Major Boss 2 after Stage 4
                this.spawnMajorBoss('Void_Reaper');
            }
        }, this.stageTransitionDuration);
    }
    
    applyRandomStatBoost() {
        const boosts = [
            { type: 'damage', min: 5, max: 15, unit: '%' },
            { type: 'speed', min: 5, max: 15, unit: '%' },
            { type: 'fireRate', min: 5, max: 15, unit: '%' },
            { type: 'health', min: 10, max: 30, unit: '' },
            { type: 'collectionRange', min: 5, max: 15, unit: 'px' }
        ];
        
        const boost = boosts[Math.floor(Math.random() * boosts.length)];
        const value = boost.min + Math.floor(Math.random() * (boost.max - boost.min + 1));
        
        switch (boost.type) {
            case 'damage':
                this.player.upgrades.damage += value / 100;
                this.statBoostMessage = `+${value}${boost.unit} Damage`;
                break;
            case 'speed':
                this.player.upgrades.speed += value / 100;
                this.statBoostMessage = `+${value}${boost.unit} Speed`;
                break;
            case 'fireRate':
                this.player.upgrades.fireRate += value / 100;
                this.statBoostMessage = `+${value}${boost.unit} Fire Rate`;
                break;
            case 'health':
                this.player.maxHealth += value;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + value);
                this.statBoostMessage = `+${value} Max Health`;
                break;
            case 'collectionRange':
                this.player.collectionRange += value;
                this.statBoostMessage = `+${value}${boost.unit} Collection Range`;
                break;
        }
        
        this.statBoostTimer = 2000;
    }
    
    spawnBoss(bossType) {
        const boss = new Boss(this.width / 2, 100, bossType, this.player);
        this.bosses.push(boss);
        this.playSound('bossSpawn');
    }
    
    spawnMajorBoss(bossType) {
        // Major bosses appear between stages
        const boss = new Boss(this.width / 2, 100, bossType, this.player);
        this.bosses.push(boss);
        this.playSound('bossSpawn');
    }
    
    spawnEnemy() {
        const levelConfig = this.getLevelConfig();
        
        // Select enemy type based on weights
        let totalWeight = 0;
        levelConfig.enemyTypes.forEach(et => totalWeight += et.weight);
        
        let random = Math.random() * totalWeight;
        let selectedType = 'basic';
        for (const et of levelConfig.enemyTypes) {
            if (random < et.weight) {
                selectedType = et.type;
                break;
            }
            random -= et.weight;
        }
        
        const x = 20 + Math.random() * (this.width - 40);
        const enemy = new Enemy(x, -50, selectedType, this.player, levelConfig);
        
        // 30% chance enemy carries a shard
        if (Math.random() < 0.3) {
            enemy.carriesShard = true;
        }
        
        this.enemies.push(enemy);
    }
    
    spawnEnergyShard(x = null, y = -20) {
        if (x === null) {
            x = 20 + Math.random() * (this.width - 40);
        }
        const fallSpeed = 150 + Math.random() * 50; // 150-200 pixels/second
        const shard = new EnergyShard(x, y, fallSpeed);
        this.energyShards.push(shard);
    }
    
    spawnWeaponDrop() {
        // Get available weapons (exclude current weapon)
        const availableWeapons = WeaponSystem.getAvailableWeapons(this.player.currentWeaponType);
        if (availableWeapons.length === 0) return;
        
        const weaponType = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
        const x = 20 + Math.random() * (this.width - 40);
        const weaponDrop = new WeaponDrop(x, -30, weaponType);
        this.weaponDrops.push(weaponDrop);
        this.playSound('weaponDrop');
    }
    
    update(deltaTime) {
        if (this.gameState === 'levelComplete') {
            this.levelCompleteTimer += deltaTime;
            
            if (this.levelCompleteTimer > this.levelCompleteDuration) {
                this.showLevelCompleteText = false;
                this.showCheckmark = false;
            }
            
            if (this.statBoostTimer > 0) {
                this.statBoostTimer -= deltaTime;
            }
            return;
        }
        
        if (this.gameState === 'stageTransition') {
            this.stageTransitionTimer += deltaTime;
            
            // Fade in text
            if (this.stageTransitionTimer < 1000) {
                this.stageTransitionAlpha = Math.min(1, this.stageTransitionTimer / 1000);
            }
            // Hold
            else if (this.stageTransitionTimer < this.stageTransitionDuration - 500) {
                this.stageTransitionAlpha = 1;
            }
            // Fade out
            else {
                this.stageTransitionAlpha = Math.max(0, 1 - (this.stageTransitionTimer - (this.stageTransitionDuration - 500)) / 500);
            }
            return;
        }
        
        if (this.gameState !== 'playing') return;
        
        // Update background
        this.updateBackground(deltaTime);
        
        // Update player
        this.player.update(deltaTime, this.keys);
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.y > -50 && bullet.y < this.height + 50 && bullet.x > -50 && bullet.x < this.width + 50;
        });
        
        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(deltaTime);
            return enemy.y < this.height + 50 && enemy.health > 0;
        });
        
        // Update energy shards
        this.energyShards = this.energyShards.filter(shard => {
            shard.update(deltaTime);
            return shard.y < this.height + 50;
        });
        
        // Update weapon drops
        this.weaponDrops = this.weaponDrops.filter(drop => {
            drop.update(deltaTime);
            return drop.y < this.height + 50;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
        
        // Update bosses
        this.bosses = this.bosses.filter(boss => {
            boss.update(deltaTime);
            return boss.health > 0;
        });
        
        // Spawn enemies
        const levelConfig = this.getLevelConfig();
        this.enemySpawnTimer += deltaTime;
        const spawnRate = levelConfig.spawnRate * (0.8 + Math.random() * 0.4); // ±20% variation
        if (this.enemySpawnTimer > spawnRate) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // Spawn energy shards (70% random falling)
        // Spawn rate: 1 shard every 2-3 seconds (randomized)
        this.shardSpawnTimer += deltaTime;
        const shardSpawnInterval = 2000 + Math.random() * 1000; // 2-3 seconds
        if (this.shardSpawnTimer > shardSpawnInterval && this.shardsCollectedThisLevel < this.shardsNeeded) {
            // Only spawn if we haven't collected all shards yet
            const shardsRemaining = this.shardsNeeded - this.shardsCollectedThisLevel;
            const randomShardsNeeded = Math.ceil(shardsRemaining * 0.7); // 70% should be random
            if (this.energyShards.length < randomShardsNeeded) {
                this.spawnEnergyShard();
                this.shardSpawnTimer = 0;
            }
        }
        
        // Spawn weapon drops (every 3-4 levels)
        this.weaponDropLevelsSinceLast++;
        if (this.weaponDropLevelsSinceLast >= 3) {
            if (this.weaponDropLevelsSinceLast === 3 && Math.random() < 0.3) {
                // 30% chance at level 3
                this.spawnWeaponDrop();
                this.weaponDropLevelsSinceLast = 0;
            } else if (this.weaponDropLevelsSinceLast >= 4) {
                // Guaranteed by level 4
                this.spawnWeaponDrop();
                this.weaponDropLevelsSinceLast = 0;
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Check level completion
        if (this.shardsCollectedThisLevel >= this.shardsNeeded) {
            this.completeLevel();
        }
        
        // Check game over
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        // Easter egg check
        if (this.totalShardsCollected === 67 && !this.easterEggTriggered) {
            this.triggerEasterEgg();
        }
    }
    
    updateBackground(deltaTime) {
        const speedBoost = this.player ? (this.player.upgrades?.speed || 1) : 1;
        
        this.stars.forEach(star => {
            star.y += star.speed * speedBoost * deltaTime / 1000;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });
        
        this.backgroundElements.forEach(elem => {
            elem.y += elem.speed * speedBoost * deltaTime / 1000;
            if (elem.y > this.height) {
                elem.y = -50;
                elem.x = Math.random() * this.width;
            }
            if (elem.rotation !== undefined) {
                elem.rotation += deltaTime / 1000 * 0.5;
            }
            if (elem.pulse !== undefined) {
                elem.pulse += deltaTime / 1000;
            }
        });
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.owner === 'player') {
                this.enemies.forEach((enemy, enemyIndex) => {
                    if (this.isColliding(bullet, enemy)) {
                        enemy.takeDamage(bullet.damage);
                        this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff4444');
                        this.playSound('hit');
                        
                        // Remove bullet (unless piercing)
                        if (!bullet.piercing || bullet.pierceCount <= 0) {
                            this.bullets.splice(bulletIndex, 1);
                        } else {
                            bullet.pierceCount--;
                        }
                        
                        // If enemy destroyed
                        if (enemy.health <= 0) {
                            this.score += enemy.points;
                            this.playSound('explosion');
                            
                            // Drop shard if enemy was carrying one
                            if (enemy.carriesShard) {
                                this.spawnEnergyShard(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                            }
                            
                            // Handle enemy splitting
                            const levelConfig = this.getLevelConfig();
                            if (levelConfig.split && levelConfig.splitTypes.includes(enemy.type)) {
                                this.splitEnemy(enemy);
                            }
                            
                            // Chance for health pickup
                            if (Math.random() < 0.05 && !enemy.carriesShard) {
                                // Could spawn health pickup here
                            }
                        }
                    }
                });
                
                // Player bullets vs bosses
                this.bosses.forEach((boss, bossIndex) => {
                    if (this.isColliding(bullet, boss)) {
                        boss.takeDamage(bullet.damage);
                        this.createExplosion(bullet.x, bullet.y, '#ff8844');
                        this.playSound('hit');
                        
                        if (!bullet.piercing || bullet.pierceCount <= 0) {
                            this.bullets.splice(bulletIndex, 1);
                        } else {
                            bullet.pierceCount--;
                        }
                        
                        if (boss.health <= 0) {
                            this.score += boss.points;
                            this.playSound('bossDefeated');
                            
                            // Boss drops shards
                            for (let i = 0; i < boss.shardDrops; i++) {
                                setTimeout(() => {
                                    this.spawnEnergyShard(boss.x + boss.width/2 + (Math.random() - 0.5) * 40, boss.y + boss.height/2);
                                }, i * 200);
                            }
                        }
                    }
                });
            }
        });
        
        // Enemy bullets vs player
        this.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.owner === 'enemy' && this.isColliding(bullet, this.player)) {
                this.player.takeDamage(bullet.damage);
                this.bullets.splice(bulletIndex, 1);
                this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#44ff44');
                this.updateUI();
            }
        });
        
        // Enemies vs player
        this.enemies.forEach(enemy => {
            if (this.isColliding(enemy, this.player)) {
                this.player.takeDamage(20);
                enemy.takeDamage(50);
                this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ffff44');
                this.updateUI();
            }
        });
        
        // Bosses vs player
        this.bosses.forEach(boss => {
            if (this.isColliding(boss, this.player)) {
                this.player.takeDamage(30);
                this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff4444');
                this.updateUI();
            }
        });
        
        // Energy shards vs player
        this.energyShards.forEach((shard, index) => {
            const dx = shard.x - (this.player.x + this.player.width/2);
            const dy = shard.y - (this.player.y + this.player.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.player.collectionRange) {
                this.collectShard(shard);
                this.energyShards.splice(index, 1);
            }
        });
        
        // Weapon drops vs player
        this.weaponDrops.forEach((drop, index) => {
            const dx = drop.x - (this.player.x + this.player.width/2);
            const dy = drop.y - (this.player.y + this.player.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) {
                this.player.collectWeapon(drop.weaponType);
                this.weaponDrops.splice(index, 1);
                this.playSound('weaponUpgrade');
            }
        });
    }
    
    collectShard(shard) {
        this.shardsCollectedThisLevel++;
        this.totalShardsCollected++;
        this.playSound('shardCollect');
        this.createExplosion(shard.x, shard.y, '#00ffff', 20);
        this.updateUI();
        
        // Easter egg check
        if (this.totalShardsCollected === 67 && !this.easterEggTriggered) {
            this.triggerEasterEgg();
        }
    }
    
    splitEnemy(enemy) {
        // Create 2 smaller enemies
        for (let i = 0; i < 2; i++) {
            const splitEnemy = new Enemy(
                enemy.x + (i - 0.5) * 20,
                enemy.y + enemy.height/2,
                enemy.type,
                this.player,
                this.getLevelConfig()
            );
            splitEnemy.width = enemy.width / 2;
            splitEnemy.height = enemy.height / 2;
            splitEnemy.health = Math.floor(enemy.maxHealth / 2);
            splitEnemy.maxHealth = splitEnemy.health;
            splitEnemy.speed = enemy.speed * 1.2; // Slightly faster
            this.enemies.push(splitEnemy);
        }
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    createExplosion(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    triggerEasterEgg() {
        this.easterEggTriggered = true;
        this.easterEggTimer = 3000; // 3 seconds
        this.createExplosion(this.width/2, this.height/2, '#ff00ff', 100);
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear canvas with stage background
        const bg = this.currentBackground;
        ctx.fillStyle = bg.baseColor;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw background elements
        this.drawBackground(ctx);
        
        if (this.gameState === 'playing' || this.gameState === 'paused' || this.gameState === 'levelComplete') {
            // Draw game objects
            this.player.render(ctx);
            
            this.bullets.forEach(bullet => bullet.render(ctx));
            this.enemies.forEach(enemy => enemy.render(ctx));
            this.energyShards.forEach(shard => shard.render(ctx));
            this.weaponDrops.forEach(drop => drop.render(ctx));
            this.particles.forEach(particle => particle.render(ctx));
            this.bosses.forEach(boss => boss.render(ctx));
            
            // Draw level complete effects
            if (this.gameState === 'levelComplete') {
                this.drawLevelCompleteEffects(ctx);
            }
        }
        
        // Draw stage transition
        if (this.gameState === 'stageTransition') {
            this.drawStageTransition(ctx);
        }
        
        // Draw easter egg
        if (this.easterEggTimer > 0) {
            this.drawEasterEgg(ctx);
        }
    }
    
    drawBackground(ctx) {
        const bg = this.currentBackground;
        
        // Draw stars
        ctx.fillStyle = bg.starColor;
        this.stars.forEach(star => {
            ctx.globalAlpha = star.brightness;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1;
        
        // Draw nebula overlay
        if (bg.nebulaColor) {
            const grad = ctx.createLinearGradient(0, 0, 0, this.height);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.5, bg.nebulaColor);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, this.width, this.height);
        }
        
        // Draw stage-specific elements
        this.backgroundElements.forEach(elem => {
            ctx.save();
            if (elem.type === 'asteroid') {
                ctx.translate(elem.x, elem.y);
                ctx.rotate(elem.rotation);
                ctx.fillStyle = '#8B7355';
                ctx.beginPath();
                ctx.arc(0, 0, elem.size/2, 0, Math.PI * 2);
                ctx.fill();
            } else if (elem.type === 'nebula') {
                ctx.globalAlpha = elem.alpha;
                const grad = ctx.createRadialGradient(elem.x, elem.y, 0, elem.x, elem.y, elem.size);
                grad.addColorStop(0, 'rgba(255, 100, 200, 0.8)');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(elem.x - elem.size, elem.y - elem.size, elem.size * 2, elem.size * 2);
            } else if (elem.type === 'rift') {
                ctx.globalAlpha = 0.5 + 0.3 * Math.sin(elem.pulse);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(elem.x, elem.y, elem.size/2, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        });
    }
    
    drawLevelCompleteEffects(ctx) {
        // Checkmark
        if (this.showCheckmark) {
            const checkX = this.width - 150;
            const checkY = 30;
            const scale = Math.min(1.2, this.levelCompleteTimer / 500);
            ctx.save();
            ctx.translate(checkX, checkY);
            ctx.scale(scale, scale);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-3, 7);
            ctx.lineTo(10, -7);
            ctx.stroke();
            ctx.restore();
        }
        
        // Level complete text
        if (this.showLevelCompleteText) {
            const alpha = Math.min(1, this.levelCompleteTimer / 500);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 48px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', this.width/2, this.height/2);
            ctx.restore();
        }
        
        // Stat boost message
        if (this.statBoostTimer > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.statBoostTimer / 500);
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 24px Courier New';
            ctx.textAlign = 'right';
            ctx.fillText(this.statBoostMessage, this.width - 20, this.height - 20);
            ctx.restore();
        }
        
        // Particle burst
        if (this.levelCompleteTimer < 100) {
            this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#00ffff', 50);
        }
    }
    
    drawStageTransition(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.globalAlpha = this.stageTransitionAlpha;
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.stageTransitionText, this.width/2, this.height/2);
        ctx.restore();
    }
    
    drawEasterEgg(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.fillStyle = '#ff00ff';
        ctx.font = 'bold 72px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('6-7', this.width/2, this.height/2 - 50);
        
        ctx.font = 'bold 24px Courier New';
        ctx.fillText('You found it: 6-7 — payback is a hug!', this.width/2, this.height/2 + 50);
        ctx.restore();
        
        this.easterEggTimer -= this.deltaTime;
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('levelValue').textContent = `${this.stage}-${this.level}`;
        document.getElementById('weaponType').textContent = `${this.player.weaponName} Lv.${this.player.weaponLevel}`;
        document.getElementById('shardCount').textContent = `${this.shardsCollectedThisLevel}/${this.shardsNeeded}`;
        
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthFill').style.width = healthPercent + '%';
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Continue with Player, Enemy, EnergyShard, WeaponDrop, Boss, Bullet, Particle classes...
// Due to length, I'll continue in the next part

// Player class with new weapon system
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.baseSpeed = 300;
        this.health = 100;
        this.maxHealth = 100;
        this.collectionRange = 30;
        
        // Weapon system
        this.currentWeaponType = 'pistol';
        this.weaponLevel = 1;
        this.weaponName = 'Pistol';
        this.lastShot = 0;
        
        // Upgrades (permanent stat boosts)
        this.upgrades = {
            speed: 1,
            damage: 1,
            fireRate: 1,
            health: 1
        };
    }
    
    update(deltaTime, keys) {
        const currentSpeed = this.baseSpeed * this.upgrades.speed;
        
        // Movement
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.x -= currentSpeed * deltaTime / 1000;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.x += currentSpeed * deltaTime / 1000;
        }
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.y -= currentSpeed * deltaTime / 1000;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            this.y += currentSpeed * deltaTime / 1000;
        }
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(this.x, game.width - this.width));
        this.y = Math.max(0, Math.min(this.y, game.height - this.height));
        
        // Shooting
        if (keys['Space'] || keys['KeyZ']) {
            this.shoot();
        }
    }
    
    shoot() {
        const weapon = WeaponSystem.getWeapon(this.currentWeaponType, this.weaponLevel);
        const now = Date.now();
        const fireRate = weapon.fireRate / this.upgrades.fireRate;
        
        if (now - this.lastShot > fireRate) {
            weapon.shoot(this, game);
            this.lastShot = now;
            game.playSound('shoot');
        }
    }
    
    collectWeapon(weaponType) {
        // Calculate power scaling
        const stageBonus = game.stage * 0.1;
        const levelBonus = (game.stage - 1) * 5 + game.level;
        const totalBonus = stageBonus + (levelBonus * 0.05);
        
        this.currentWeaponType = weaponType;
        this.weaponLevel = 1;
        this.weaponName = WeaponSystem.getWeaponName(weaponType);
        
        // Apply power scaling to base weapon stats
        const baseWeapon = WeaponSystem.getWeapon(weaponType, 1);
        baseWeapon.applyPowerScaling(totalBonus);
    }
    
    upgradeWeapon() {
        if (this.weaponLevel < 5) {
            this.weaponLevel++;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // Draw ship body
        const bodyGradient = ctx.createLinearGradient(this.x + 10, this.y + 10, this.x + 30, this.y + 40);
        bodyGradient.addColorStop(0, '#00ff88');
        bodyGradient.addColorStop(0.5, '#00cc44');
        bodyGradient.addColorStop(1, '#008822');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(this.x + 10, this.y + 10, 20, 30);
        
        // Draw wings
        const wingGradient = ctx.createLinearGradient(this.x, this.y + 20, this.x + 40, this.y + 35);
        wingGradient.addColorStop(0, '#00aa22');
        wingGradient.addColorStop(0.5, '#00cc44');
        wingGradient.addColorStop(1, '#006611');
        ctx.fillStyle = wingGradient;
        ctx.fillRect(this.x, this.y + 20, 10, 15);
        ctx.fillRect(this.x + 30, this.y + 20, 10, 15);
        
        // Draw cockpit
        ctx.fillStyle = '#88ff88';
        ctx.fillRect(this.x + 15, this.y + 5, 10, 10);
        
        // Draw engine glow
        const pulseIntensity = 0.8 + 0.2 * Math.sin(Date.now() / 100);
        ctx.fillStyle = `rgba(0, 136, 255, ${pulseIntensity})`;
        ctx.fillRect(this.x + 12, this.y + 35, 6, 8);
        ctx.fillRect(this.x + 22, this.y + 35, 6, 8);
        
        ctx.restore();
    }
}

// Energy Shard class
class EnergyShard {
    constructor(x, y, fallSpeed) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.fallSpeed = fallSpeed;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trail = [];
    }
    
    update(deltaTime) {
        this.y += this.fallSpeed * deltaTime / 1000;
        this.pulsePhase += deltaTime / 1000 * 4; // Cycle every 0.5 seconds
        
        // Add to trail
        this.trail.push({x: this.x, y: this.y, life: 1.0});
        if (this.trail.length > 5) {
            this.trail.shift();
        }
        
        // Update trail
        this.trail.forEach(t => t.life -= deltaTime / 1000 * 2);
        this.trail = this.trail.filter(t => t.life > 0);
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw trail
        this.trail.forEach((t, i) => {
            ctx.globalAlpha = t.life * 0.3;
            ctx.fillStyle = '#00DDFF';
            ctx.fillRect(t.x - 3, t.y - 3, 6, 6);
        });
        
        // Draw shard with pulse
        const scale = 1.0 + 0.3 * Math.sin(this.pulsePhase);
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
        
        // Outer glow
        const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
        glowGrad.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(-8, -8, 16, 16);
        
        // Core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-3, -3, 6, 6);
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(-2, -2, 4, 4);
        
        ctx.restore();
    }
}

// Weapon Drop class
class WeaponDrop {
    constructor(x, y, weaponType) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.fallSpeed = 200;
        this.weaponType = weaponType;
        this.rotation = 0;
        this.pulsePhase = 0;
    }
    
    update(deltaTime) {
        this.y += this.fallSpeed * deltaTime / 1000;
        this.rotation += deltaTime / 1000 * 2;
        this.pulsePhase += deltaTime / 1000 * 3;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        const scale = 1.0 + 0.2 * Math.sin(this.pulsePhase);
        ctx.scale(scale, scale);
        
        // Glow
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        
        // Weapon icon (simplified)
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-6, -6, 12, 12);
        
        // Weapon name
        ctx.restore();
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(WeaponSystem.getWeaponName(this.weaponType), this.x + this.width/2, this.y - 5);
    }
}

// Enemy class with behavior progression
class Enemy {
    constructor(x, y, type, player, levelConfig) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.player = player;
        this.levelConfig = levelConfig;
        this.carriesShard = false;
        this.moveTimer = 0;
        this.angle = 0;
        this.radius = 0;
        this.direction = 1;
        
        // Configure based on type (from plan specifications)
        this.setupEnemyType(type);
        
        // Apply level speed multiplier
        this.speed = this.baseSpeed * (this.levelConfig.speed / 100);
        
        // Level 1: 0.8x speed multiplier
        if (game.level === 1) {
            this.speed *= 0.8;
        }
    }
    
    setupEnemyType(type) {
        const configs = {
            'basic': { health: 30, baseSpeed: 100, width: 30, height: 30, points: 100, fireRate: 2000, canShoot: false },
            'scout': { health: 10, baseSpeed: 120, width: 20, height: 20, points: 50, fireRate: 1500, canShoot: false },
            'zigzag': { health: 25, baseSpeed: 150, width: 30, height: 30, points: 180, fireRate: 1000, canShoot: true },
            'fast': { health: 15, baseSpeed: 250, width: 25, height: 25, points: 150, fireRate: 800, canShoot: true },
            'fighter': { health: 20, baseSpeed: 150, width: 25, height: 25, points: 100, fireRate: 1000, canShoot: true },
            'sidewinder': { health: 20, baseSpeed: 200, width: 28, height: 28, points: 160, fireRate: 700, canShoot: true },
            'hunter': { health: 40, baseSpeed: 180, width: 35, height: 35, points: 250, fireRate: 1200, canShoot: true },
            'bomber': { health: 80, baseSpeed: 80, width: 45, height: 45, points: 350, fireRate: 2000, canShoot: true },
            'heavy': { health: 120, baseSpeed: 60, width: 50, height: 50, points: 400, fireRate: 600, canShoot: true },
            'spiral': { health: 35, baseSpeed: 120, width: 32, height: 32, points: 220, fireRate: 900, canShoot: true, radius: 50 },
            'turret': { health: 70, baseSpeed: 0, width: 34, height: 34, points: 300, fireRate: 1100, canShoot: true },
            'elite_hunter': { health: 80, baseSpeed: 220, width: 40, height: 40, points: 500, fireRate: 800, canShoot: true },
            'elite_bomber': { health: 150, baseSpeed: 100, width: 55, height: 55, points: 600, fireRate: 1500, canShoot: true },
            'elite_spiral': { health: 60, baseSpeed: 150, width: 38, height: 38, points: 450, fireRate: 600, canShoot: true, radius: 60 }
        };
        
        const config = configs[type] || configs['basic'];
        this.health = config.health;
        this.maxHealth = config.health;
        this.baseSpeed = config.baseSpeed;
        this.width = config.width;
        this.height = config.height;
        this.points = config.points;
        this.fireRate = config.fireRate;
        this.canShoot = config.canShoot;
        this.radius = config.radius || 0;
        this.lastShot = 0;
    }
    
    update(deltaTime) {
        this.moveTimer += deltaTime;
        
        // Movement patterns based on type and level
        if (this.type === 'zigzag' && game.level >= 2) {
            // Zigzag pattern
            this.y += this.speed * deltaTime / 1000;
            const amplitude = 30 + Math.random() * 20;
            const frequency = 1 + Math.random();
            this.x += Math.sin(this.moveTimer / (frequency * 1000)) * amplitude * deltaTime / 1000;
        } else if (this.type === 'sidewinder') {
            this.y += this.speed * deltaTime / 1000 * 0.3;
            this.x += Math.sin(this.moveTimer / 150) * 5;
        } else if (this.type === 'hunter' || this.type === 'elite_hunter') {
            // Track player
            if (this.player) {
                const dx = this.player.x - this.x;
                const dy = this.player.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    const huntSpeed = this.type === 'elite_hunter' ? 0.7 : 0.5;
                    this.x += (dx / distance) * this.speed * deltaTime / 1000 * huntSpeed;
                    this.y += (dy / distance) * this.speed * deltaTime / 1000 * huntSpeed;
                }
            } else {
                this.y += this.speed * deltaTime / 1000;
            }
        } else if (this.type === 'spiral' || this.type === 'elite_spiral') {
            this.angle += deltaTime / 100;
            this.radius += deltaTime / 500;
            const centerX = game.width / 2;
            this.x = centerX + Math.cos(this.angle) * this.radius;
            this.y += this.speed * deltaTime / 1000 * 0.5;
        } else if (this.type === 'turret') {
            // Moves with background
            this.y += 50 * deltaTime / 1000;
        } else {
            // Basic movement (straight down)
            this.y += this.speed * deltaTime / 1000;
            // Slight horizontal drift
            this.x += Math.sin(this.moveTimer / 500) * 1;
        }
        
        // Keep in bounds
        this.x = Math.max(0, Math.min(this.x, game.width - this.width));
        
        // Shooting (Level 3+)
        if (game.level >= 3 && this.canShoot) {
            const shootChance = (this.levelConfig.shootPercent / 100) * 0.01;
            if (Math.random() < shootChance && this.y > 50) {
                this.shoot();
            }
        }
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.fireRate) {
            switch (this.type) {
                case 'bomber':
                case 'elite_bomber':
                    const bombCount = this.type === 'elite_bomber' ? 5 : 3;
                    for (let i = -(bombCount-1)/2; i <= (bombCount-1)/2; i++) {
                        game.bullets.push(new Bullet(this.x + this.width/2 + i * 15, this.y + this.height, 'enemy', 'bomb'));
                    }
                    break;
                case 'heavy':
                    for (let i = -1; i <= 1; i++) {
                        game.bullets.push(new Bullet(this.x + this.width/2 + i * 20, this.y + this.height, 'enemy', 'heavy'));
                    }
                    break;
                case 'hunter':
                case 'elite_hunter':
                    const homingCount = this.type === 'elite_hunter' ? 2 : 1;
                    for (let i = 0; i < homingCount; i++) {
                        const bullet = new Bullet(this.x + this.width/2 + (i - 0.5) * 10, this.y + this.height, 'enemy', 'homing');
                        bullet.target = this.player;
                        game.bullets.push(bullet);
                    }
                    break;
                case 'spiral':
                case 'elite_spiral':
                    const spiralCount = this.type === 'elite_spiral' ? 5 : 3;
                    for (let i = 0; i < spiralCount; i++) {
                        game.bullets.push(new Bullet(this.x + this.width/2, this.y + this.height, 'enemy', 'spiral', i * Math.PI * 2 / spiralCount));
                    }
                    break;
                case 'zigzag':
                    game.bullets.push(new Bullet(this.x + this.width/2 - 8, this.y + this.height, 'enemy', 'basic'));
                    game.bullets.push(new Bullet(this.x + this.width/2 + 8, this.y + this.height, 'enemy', 'basic'));
                    break;
                default:
                    game.bullets.push(new Bullet(this.x + this.width/2, this.y + this.height, 'enemy', 'basic'));
            }
            this.lastShot = now;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // Draw enemy based on type
        const colors = {
            'basic': '#ff8800',
            'scout': '#ff6666',
            'zigzag': '#00ff88',
            'fast': '#ff4444',
            'fighter': '#66ff66',
            'sidewinder': '#8800ff',
            'hunter': '#ff0080',
            'bomber': '#8B4513',
            'heavy': '#8844ff',
            'spiral': '#ffaa00',
            'turret': '#444a55',
            'elite_hunter': '#ff44aa',
            'elite_bomber': '#A0522D',
            'elite_spiral': '#ffcc44'
        };
        
        ctx.fillStyle = colors[this.type] || '#ff8800';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw shard if carrying
        if (this.carriesShard) {
            ctx.fillStyle = '#00FFFF';
            ctx.fillRect(this.x + this.width/2 - 6, this.y - 10, 12, 12);
        }
        
        // Health bar if damaged
        if (this.health < this.maxHealth) {
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x, this.y - 8, this.width, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y - 8, this.width * healthPercent, 4);
        }
        
        ctx.restore();
    }
}

// Boss class
class Boss {
    constructor(x, y, bossType, player) {
        this.x = x;
        this.y = y;
        this.bossType = bossType;
        this.player = player;
        this.moveTimer = 0;
        this.attackTimer = 0;
        this.phase = 1;
        this.direction = 1;
        this.teleportTimer = 0;
        
        this.setupBoss(bossType);
    }
    
    setupBoss(bossType) {
        const configs = {
            'Stage1_Boss': { health: 500, width: 80, height: 80, points: 1000, shardDrops: 3, speed: 50, attackRate: 2000, attackType: 'spread3' },
            'Stage2_Boss': { health: 750, width: 90, height: 90, points: 1500, shardDrops: 4, speed: 80, attackRate: 1500, attackType: 'spread5' },
            'Stage3_Boss': { health: 1000, width: 100, height: 100, points: 2000, shardDrops: 5, speed: 60, attackRate: 1200, attackType: 'spread7' },
            'Stage4_Boss': { health: 1500, width: 110, height: 110, points: 3000, shardDrops: 6, speed: 100, attackRate: 1000, attackType: 'spread9' },
            'Stage5_FinalBoss': { health: 2500, width: 120, height: 120, points: 5000, shardDrops: 10, speed: 70, attackRate: 800, attackType: 'spread12' },
            'Asteroid_Crusher': { health: 2000, width: 130, height: 130, points: 4000, shardDrops: 8, speed: 40, attackRate: 2000, attackType: 'asteroid' },
            'Void_Reaper': { health: 3000, width: 140, height: 140, points: 6000, shardDrops: 10, speed: 120, attackRate: 1500, attackType: 'void' }
        };
        
        const config = configs[bossType] || configs['Stage1_Boss'];
        this.health = config.health;
        this.maxHealth = config.health;
        this.width = config.width;
        this.height = config.height;
        this.points = config.points;
        this.shardDrops = config.shardDrops;
        this.speed = config.speed;
        this.attackRate = config.attackRate;
        this.attackType = config.attackType;
    }
    
    update(deltaTime) {
        this.moveTimer += deltaTime;
        this.attackTimer += deltaTime;
        
        // Movement patterns
        if (this.bossType === 'Stage1_Boss') {
            // Slow horizontal
            this.x += this.speed * this.direction * deltaTime / 1000;
            if (this.x < 50 || this.x > game.width - this.width - 50) {
                this.direction *= -1;
            }
        } else if (this.bossType === 'Stage2_Boss') {
            // Zigzag
            this.x += this.speed * this.direction * deltaTime / 1000;
            this.y += Math.sin(this.moveTimer / 500) * 20 * deltaTime / 1000;
            if (this.x < 50 || this.x > game.width - this.width - 50) {
                this.direction *= -1;
            }
        } else if (this.bossType === 'Stage4_Boss' || this.bossType === 'Void_Reaper') {
            // Teleportation
            this.teleportTimer += deltaTime;
            if (this.teleportTimer > 4000) {
                this.x = 50 + Math.random() * (game.width - this.width - 100);
                this.y = 50 + Math.random() * 200;
                this.teleportTimer = 0;
            }
        } else if (this.bossType === 'Stage5_FinalBoss') {
            // Complex pattern
            this.x += Math.cos(this.moveTimer / 1000) * this.speed * deltaTime / 1000;
            this.y += Math.sin(this.moveTimer / 800) * 30 * deltaTime / 1000;
            this.x = Math.max(50, Math.min(game.width - this.width - 50, this.x));
            this.y = Math.max(50, Math.min(300, this.y));
        }
        
        // Attacks
        if (this.attackTimer > this.attackRate) {
            this.attack();
            this.attackTimer = 0;
        }
        
        // Phase changes
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < 0.75 && this.phase === 1) {
            this.phase = 2;
            this.attackRate *= 0.8;
        } else if (healthPercent < 0.5 && this.phase === 2) {
            this.phase = 3;
            this.attackRate *= 0.8;
        } else if (healthPercent < 0.25 && this.phase === 3) {
            this.phase = 4;
            this.attackRate *= 0.8;
        }
    }
    
    attack() {
        switch (this.attackType) {
            case 'spread3':
                for (let i = -1; i <= 1; i++) {
                    game.bullets.push(new Bullet(this.x + this.width/2 + i * 20, this.y + this.height, 'enemy', 'heavy'));
                }
                break;
            case 'spread5':
                for (let i = -2; i <= 2; i++) {
                    game.bullets.push(new Bullet(this.x + this.width/2 + i * 15, this.y + this.height, 'enemy', 'heavy'));
                }
                if (Math.random() < 0.3) {
                    const bullet = new Bullet(this.x + this.width/2, this.y + this.height, 'enemy', 'homing');
                    bullet.target = this.player;
                    game.bullets.push(bullet);
                }
                break;
            case 'spread7':
                for (let i = -3; i <= 3; i++) {
                    game.bullets.push(new Bullet(this.x + this.width/2 + i * 12, this.y + this.height, 'enemy', 'heavy'));
                }
                if (Math.random() < 0.4) {
                    const bullet = new Bullet(this.x + this.width/2, this.y + this.height, 'enemy', 'homing');
                    bullet.target = this.player;
                    game.bullets.push(bullet);
                }
                break;
            case 'spread9':
                for (let i = -4; i <= 4; i++) {
                    game.bullets.push(new Bullet(this.x + this.width/2 + i * 10, this.y + this.height, 'enemy', 'heavy'));
                }
                if (Math.random() < 0.5) {
                    const bullet = new Bullet(this.x + this.width/2, this.y + this.height, 'enemy', 'homing');
                    bullet.target = this.player;
                    game.bullets.push(bullet);
                }
                break;
            case 'spread12':
                for (let i = -5; i <= 5; i++) {
                    game.bullets.push(new Bullet(this.x + this.width/2 + i * 8, this.y + this.height, 'enemy', 'heavy'));
                }
                if (Math.random() < 0.6) {
                    const bullet = new Bullet(this.x + this.width/2, this.y + this.height, 'enemy', 'homing');
                    bullet.target = this.player;
                    game.bullets.push(bullet);
                }
                break;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw boss
        const bossColors = {
            'Stage1_Boss': '#ff0080',
            'Stage2_Boss': '#8B7355',
            'Stage3_Boss': '#ff88ff',
            'Stage4_Boss': '#0000ff',
            'Stage5_FinalBoss': '#ff0000',
            'Asteroid_Crusher': '#654321',
            'Void_Reaper': '#4400aa'
        };
        
        ctx.fillStyle = bossColors[this.bossType] || '#ff0080';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Glowing core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + this.width/2 - 10, this.y + this.height/2 - 10, 20, 20);
        
        // Health bar
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y - 15, this.width, 6);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 15, this.width * healthPercent, 6);
        
        ctx.restore();
    }
}

// Bullet class
class Bullet {
    constructor(x, y, owner, type = 'basic', angle = 0) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.type = type;
        this.angle = angle;
        this.target = null;
        this.piercing = false;
        this.pierceCount = 0;
        
        this.setupBullet();
    }
    
    setupBullet() {
        if (this.owner === 'player') {
            const weapon = WeaponSystem.getWeapon(game.player.currentWeaponType, game.player.weaponLevel);
            this.damage = weapon.damage * game.player.upgrades.damage;
            this.speed = weapon.bulletSpeed;
            this.width = weapon.bulletWidth;
            this.height = weapon.bulletHeight;
            this.color = weapon.bulletColor;
            this.vy = -this.speed;
            this.vx = 0;
            
            if (weapon.piercing) {
                this.piercing = true;
                this.pierceCount = weapon.pierceCount || 2;
            }
        } else {
            const configs = {
                'basic': { damage: 20, speed: 300, width: 4, height: 8, color: '#ff4444' },
                'heavy': { damage: 30, speed: 250, width: 6, height: 12, color: '#8844ff' },
                'bomb': { damage: 40, speed: 200, width: 8, height: 8, color: '#8B4513' },
                'homing': { damage: 25, speed: 180, width: 5, height: 8, color: '#ff0080' },
                'spiral': { damage: 20, speed: 150, width: 4, height: 6, color: '#ffaa00' }
            };
            
            const config = configs[this.type] || configs['basic'];
            this.damage = config.damage;
            this.speed = config.speed;
            this.width = config.width;
            this.height = config.height;
            this.color = config.color;
            this.vy = this.speed;
            this.vx = 0;
            
            if (this.type === 'spiral') {
                this.vx = Math.cos(this.angle) * this.speed * 0.3;
                this.vy = Math.sin(this.angle) * this.speed * 0.3 + this.speed;
            }
        }
    }
    
    update(deltaTime) {
        if (this.type === 'homing' && this.target && this.target.health > 0) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                const homingForce = this.owner === 'player' ? 100 : 50;
                this.vx += (dx / distance) * homingForce * deltaTime / 1000;
                this.vy += (dy / distance) * homingForce * deltaTime / 1000;
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > Math.abs(this.speed)) {
                    this.vx = (this.vx / speed) * Math.abs(this.speed);
                    this.vy = (this.vy / speed) * Math.abs(this.speed);
                }
            }
        } else if (this.type === 'spiral') {
            this.x += this.vx * deltaTime / 1000;
            this.y += this.vy * deltaTime / 1000;
            this.angle += deltaTime / 100;
            this.vx = Math.cos(this.angle) * this.speed * 0.3;
        } else {
            this.y += this.vy * deltaTime / 1000;
            this.x += this.vx * deltaTime / 1000;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        if (this.owner === 'player') {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 5;
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
        ctx.restore();
    }
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = (Math.random() - 0.5) * 200;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        this.life -= this.decay;
        this.size *= 0.99;
    }
    
    render(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// Weapon System - manages all 8 weapon types
class WeaponSystem {
    static weapons = {
        'pistol': {
            name: 'Pistol',
            baseFireRate: 300,
            baseDamage: 20,
            baseBulletSpeed: 500,
            baseBulletWidth: 4,
            baseBulletHeight: 8,
            bulletColor: '#ffffff',
            upgrades: [
                { fireRate: 1.25, damage: 1.20, projectiles: 1 },
                { fireRate: 1.50, damage: 1.40, projectiles: 1 },
                { fireRate: 1.75, damage: 1.60, projectiles: 1 },
                { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'piercing' }
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
            upgrades: [
                { fireRate: 1.25, damage: 1.20, projectiles: 1 },
                { fireRate: 1.50, damage: 1.40, projectiles: 1 },
                { fireRate: 1.75, damage: 1.60, projectiles: 1 },
                { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'critical' }
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
            upgrades: [
                { fireRate: 1.25, damage: 1.20, projectiles: 1 },
                { fireRate: 1.50, damage: 1.40, projectiles: 1 },
                { fireRate: 1.75, damage: 1.60, projectiles: 1 },
                { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'burst' }
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
            baseBulletSpeed: 1000,
            baseBulletWidth: 3,
            baseBulletHeight: 30,
            bulletColor: '#ff00ff',
            upgrades: [
                { fireRate: 1.25, damage: 1.20, projectiles: 1 },
                { fireRate: 1.50, damage: 1.40, projectiles: 1 },
                { fireRate: 1.75, damage: 1.60, projectiles: 1 },
                { fireRate: 2.00, damage: 1.80, projectiles: 1, special: 'extendedBeam' }
            ]
        }
    };
    
    static getWeapon(weaponType, level) {
        const weapon = this.weapons[weaponType];
        if (!weapon) return this.weapons['pistol'];
        
        const upgrade = level > 1 ? weapon.upgrades[level - 2] : null;
        
        return {
            name: weapon.name,
            fireRate: upgrade ? weapon.baseFireRate / upgrade.fireRate : weapon.baseFireRate,
            damage: upgrade ? weapon.baseDamage * upgrade.damage : weapon.baseDamage,
            bulletSpeed: weapon.baseBulletSpeed,
            bulletWidth: weapon.baseBulletWidth,
            bulletHeight: weapon.baseBulletHeight,
            bulletColor: weapon.bulletColor,
            projectiles: upgrade ? (upgrade.projectiles || 1) : (weapon.baseProjectiles || 1),
            special: upgrade ? upgrade.special : null,
            piercing: upgrade && upgrade.special === 'piercing',
            pierceCount: 2,
            shoot: (player, game) => {
                const projectiles = upgrade ? upgrade.projectiles : (weapon.baseProjectiles || 1);
                const angleSpread = projectiles > 1 ? Math.PI / 6 : 0;
                
                for (let i = 0; i < projectiles; i++) {
                    const angle = projectiles > 1 ? (i - (projectiles-1)/2) * angleSpread / (projectiles-1) : 0;
                    const bullet = new Bullet(
                        player.x + player.width/2,
                        player.y,
                        'player',
                        weaponType
                    );
                    if (angle !== 0) {
                        bullet.vx = Math.sin(angle) * bullet.speed * 0.2;
                        bullet.vy = -Math.cos(angle) * bullet.speed;
                    }
                    game.bullets.push(bullet);
                }
            },
            applyPowerScaling: (bonus) => {
                weapon.baseDamage *= (1 + bonus);
                weapon.baseFireRate *= (1 - bonus * 0.1);
            }
        };
    }
    
    static getWeaponName(weaponType) {
        return this.weapons[weaponType]?.name || 'Pistol';
    }
    
    static getAvailableWeapons(currentWeapon) {
        return Object.keys(this.weapons).filter(w => w !== currentWeapon);
    }
}

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new Game();
});
