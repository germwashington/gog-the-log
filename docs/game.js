// Tyrian Reborn - Game Engine
// v3.0: Now using Bookwormy Guy for data storage

import { BookwormyGuy } from './modules/bookwormy-guy.js';
import { telemetry } from './modules/telemetry-system.js';
import { DebugPanel } from './modules/debug-panel.js';
import { wrapWithTelemetry } from './modules/telemetry-wrapper.js';

// Create global Bookwormy Guy instance
const dataStoreRaw = new BookwormyGuy();

// Wrap with telemetry logging
const dataStore = wrapWithTelemetry(dataStoreRaw, 'BookwormyGuy', telemetry);

// Build/version marker so we can prove which client code is running (helps debug cache issues)
console.log('[Tyrian] game.js loaded (build=2025-12-18-weapon-switch-debug-3)');

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Expose for debugging in the browser console (read-only convention)
        try { window.__tyrianGame = this; } catch (e) {}
        
        // Bookwormy Guy cache - this module's own memory
        // Each module maintains its own cache of Bookwormy Guy responses
        this.bookwormyCache = new Map();
        
        // Create cached wrapper for dataStore
        this.dataStore = this.createCachedDataStore(dataStore);
        
        // Get canvas size from Bookwormy Guy config
        const config = this.dataStore.getGameConfig();
        this.width = config.CANVAS_WIDTH;
        this.height = config.CANVAS_HEIGHT;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Game state
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.isPaused = false; // For debug panel pause
        this.score = 0;
        this.level = 1;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Game objects
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.stars = [];
        
        // Input handling
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        
        // Game settings - get from Bookwormy Guy
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 2000; // Will be updated from level config
        this.scrollSpeed = 50;
        this.backgroundOffset = 0;
        
        // Audio system
        this.audioEnabled = true;
        this.sounds = {};
        
        this.init();
    }
    
    /**
     * Create a cached wrapper for Bookwormy Guy
     * This module maintains its own cache - each module has its own memory
     * Bookwormy Guy responses are immutable, so we cache them per method+arguments
     */
    createCachedDataStore(dataStore) {
        const cache = this.bookwormyCache;
        
        return new Proxy(dataStore, {
            get(target, prop, receiver) {
                const original = Reflect.get(target, prop, receiver);
                
                const methodName = String(prop);
                
                // If it's a function, optionally wrap it with caching
                if (typeof original === 'function' && prop !== 'constructor') {
                    return function(...args) {
                        // Create cache key from method name and arguments
                        const cacheKey = `${methodName}:${JSON.stringify(args)}`;
                        
                        // Check cache first - this module's memory
                        if (cache.has(cacheKey)) {
                            return cache.get(cacheKey);
                        }
                        
                        // Call original method
                        const result = original.apply(target, args);
                        
                        // Store in cache (Bookwormy Guy responses are immutable)
                        cache.set(cacheKey, result);
                        
                        return result;
                    };
                }
                
                return original;
            }
        });
    }
    
    init() {
        this.setupEventListeners();
        this.createStarField();
        this.createAudioContext();
        this.player = new Player(this.width / 2, this.height - 100, this.dataStore);
        
        // Initialize debug panel
        this.debugPanel = new DebugPanel(telemetry, this);
        
        // Log game initialization
        telemetry.logEvent('game_initialized', 'Game');
        
        this.gameLoop();
    }
    
    createAudioContext() {
        // Create simple procedural sound effects using Web Audio API
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
            case 'powerup':
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                duration = 0.2;
                break;
            case 'hit':
                oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                duration = 0.05;
                break;
        }
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            // Only treat as a new press if we didn't already have it down
            const wasDown = !!this.keys[e.code];
            this.keys[e.code] = true;

            // Debug/telemetry proof: log weapon key presses at the moment they happen
            // (this is independent of Player.update timing and helps confirm input codes like Numpad3)
            if (!wasDown) {
                const weaponKeyMap = {
                    Digit1: { slot: 1, weaponKey: 'pulse' },
                    Digit2: { slot: 2, weaponKey: 'laser' },
                    Digit3: { slot: 3, weaponKey: 'spread' },
                    Digit4: { slot: 4, weaponKey: 'homing' },
                    Numpad1: { slot: 1, weaponKey: 'pulse' },
                    Numpad2: { slot: 2, weaponKey: 'laser' },
                    Numpad3: { slot: 3, weaponKey: 'spread' },
                    Numpad4: { slot: 4, weaponKey: 'homing' },
                };
                const meta = weaponKeyMap[e.code];
                if (meta) {
                    // try {
                    //     telemetry.logEvent('weapon_keydown', 'Game', { code: e.code, ...meta });
                    // } catch (err) {}

                    // Edge-triggered weapon switching (don't rely on per-frame polling)
                    try {
                        if (this.player) {
                            this.player.switchWeapon(meta.slot, meta.weaponKey, e.code);
                        }
                    } catch (err) {
                        try { telemetry.logError('Game', err); } catch (e) {}
                    }
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
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });
        
        // UI buttons
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
    
    createStarField() {
        this.stars = [];
        // Far layer - small, slow
        for (let i = 0; i < 60; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                speed: 20 + Math.random() * 20, // px/sec
                brightness: Math.random() * 0.4 + 0.1,
                size: 1
            });
        }
        // Mid layer - medium
        for (let i = 0; i < 45; i++) {
            this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                speed: 40 + Math.random() * 40,
                brightness: Math.random() * 0.5 + 0.2,
                size: 2
            });
        }
        // Near layer - large, fast
        for (let i = 0; i < 30; i++) {
            this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                speed: 70 + Math.random() * 50,
                brightness: Math.random() * 0.6 + 0.4,
                size: 3
            });
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        // IMPORTANT: always pass the (cached + telemetry-wrapped) BookwormyGuy datastore
        // Otherwise the new Player instance will lose access to BookwormyGuy and weapons will stay at defaults.
        this.player = new Player(this.width / 2, this.height - 100, this.dataStore);
        this.enemySpawnTimer = 0;
        
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
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        // Don't update if paused by debug panel
        if (this.isPaused) return;
        
        // Update background
        this.backgroundOffset += this.scrollSpeed * deltaTime / 1000;
        if (this.backgroundOffset > this.height) {
            this.backgroundOffset = 0;
        }
        
        // Update stars (parallax) and background offset
        const speedBoost = this.player ? (this.player.upgrades?.speed || 1) : 1;
        this.backgroundOffset += (this.scrollSpeed * 0.6 * speedBoost) * deltaTime / 1000;
        if (this.backgroundOffset > this.height) {
            this.backgroundOffset -= this.height;
        }

        this.stars.forEach(star => {
            star.y += star.speed * speedBoost * deltaTime / 1000;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });
        
        // Update player
        this.player.update(deltaTime, this.keys);
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.update(deltaTime);
            return bullet.y > -10 && bullet.y < this.height + 10;
        });
        
        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            enemy.update(deltaTime);
            return enemy.y < this.height + 50 && enemy.health > 0;
        });
        
        // Update power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.update(deltaTime);
            return powerUp.y < this.height + 50;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
        
        // Spawn enemies
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer > this.enemySpawnRate) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
            
            // Increase difficulty over time
            if (this.enemySpawnRate > 500) {
                this.enemySpawnRate -= 10;
            }
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update level
        if (this.score > this.level * 1000) {
            this.level++;
            this.updateUI();
        }
        
        // Check game over
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    spawnEnemy() {
        const enemyTypes = [
            // Basic enemies (weak)
            'scout', 'drone', 'fighter',
            // Medium enemies
            'basic', 'fast', 'zigzag', 'sidewinder',
            // Strong enemies
            'heavy', 'hunter', 'bomber', 'spiral', 'turret',
            // Elite enemies (rare)
            'elite_hunter', 'elite_bomber', 'elite_spiral'
        ];
        
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const x = Math.random() * (this.width - 60) + 30;
        this.enemies.push(new Enemy(x, -50, type, this.player, this.dataStore));
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.owner === 'player') {
                this.enemies.forEach((enemy, enemyIndex) => {
                    if (this.isColliding(bullet, enemy)) {
                        // Create explosion particles
                        this.createExplosion(enemy.x, enemy.y, '#ff4444');
                        
                        // Damage enemy
                        enemy.takeDamage(bullet.damage);
                        
                        // Remove bullet
                            this.bullets.splice(bulletIndex, 1);
                        
                        // Play hit sound
                        this.playSound('hit');
                        
                        // If enemy is destroyed
                        if (enemy.health <= 0) {
                            this.score += enemy.points;
                            this.updateUI();
                            this.playSound('explosion');
                            
                            // Chance to drop power-up
                            if (Math.random() < 0.1) {
                                this.powerUps.push(new PowerUp(enemy.x, enemy.y));
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
                this.createExplosion(this.player.x, this.player.y, '#44ff44');
                this.updateUI();
            }
        });
        
        // Enemy bullets vs enemies (friendly fire)
        this.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.owner === 'enemy') {
                this.enemies.forEach((enemy, enemyIndex) => {
                    if (this.isColliding(bullet, enemy)) {
                        // Create explosion particles
                        this.createExplosion(enemy.x, enemy.y, '#ff8844');
                        
                        // Damage enemy
                        enemy.takeDamage(bullet.damage);
                        
                        // Remove bullet
                        this.bullets.splice(bulletIndex, 1);
                        
                        // Play hit sound
                        this.playSound('hit');
                        
                        // If enemy is destroyed
                        if (enemy.health <= 0) {
                            this.score += enemy.points;
                            this.updateUI();
                            this.playSound('explosion');
                            
                            // Chance to drop power-up
                            if (Math.random() < 0.1) {
                                this.powerUps.push(new PowerUp(enemy.x, enemy.y));
                            }
                        }
                    }
                });
            }
        });
        
        // Enemies vs player
        this.enemies.forEach(enemy => {
            if (this.isColliding(enemy, this.player)) {
                this.player.takeDamage(20);
                enemy.takeDamage(50);
                this.createExplosion(enemy.x, enemy.y, '#ffff44');
                this.updateUI();
            }
        });
        
        // Enemy vs enemy collision - push them apart
        for (let i = 0; i < this.enemies.length; i++) {
            for (let j = i + 1; j < this.enemies.length; j++) {
                const enemy1 = this.enemies[i];
                const enemy2 = this.enemies[j];
                
                if (this.isColliding(enemy1, enemy2)) {
                    // Calculate sizes (area as proxy for size)
                    const size1 = enemy1.width * enemy1.height;
                    const size2 = enemy2.width * enemy2.height;
                    
                    // Calculate direction from enemy1 to enemy2
                    const dx = enemy2.x - enemy1.x;
                    const dy = enemy2.y - enemy1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        // Normalize direction
                        const nx = dx / distance;
                        const ny = dy / distance;
                        
                        // Push distance (half overlap)
                        const overlap = (enemy1.width + enemy2.width) / 2 - Math.abs(dx);
                        const pushDistance = overlap * 0.5;
                        
                        if (size1 < size2) {
                            // Smaller enemy gets pushed more
                            enemy1.x -= nx * pushDistance * 1.5;
                            enemy1.y -= ny * pushDistance * 1.5;
                            enemy2.x += nx * pushDistance * 0.5;
                            enemy2.y += ny * pushDistance * 0.5;
                        } else if (size2 < size1) {
                            // Smaller enemy gets pushed more
                            enemy1.x -= nx * pushDistance * 0.5;
                            enemy1.y -= ny * pushDistance * 0.5;
                            enemy2.x += nx * pushDistance * 1.5;
                            enemy2.y += ny * pushDistance * 1.5;
                        } else {
                            // Equal size - both pushed equally
                            enemy1.x -= nx * pushDistance;
                            enemy1.y -= ny * pushDistance;
                            enemy2.x += nx * pushDistance;
                            enemy2.y += ny * pushDistance;
                        }
                        
                        // Keep enemies in bounds
                        enemy1.x = Math.max(0, Math.min(enemy1.x, this.width - enemy1.width));
                        enemy1.y = Math.max(0, Math.min(enemy1.y, this.height - enemy1.height));
                        enemy2.x = Math.max(0, Math.min(enemy2.x, this.width - enemy2.width));
                        enemy2.y = Math.max(0, Math.min(enemy2.y, this.height - enemy2.height));
                    }
                }
            }
        }
        
        // Power-ups vs player
        this.powerUps.forEach((powerUp, index) => {
            if (this.isColliding(powerUp, this.player)) {
                powerUp.apply(this.player);
                this.powerUps.splice(index, 1);
                this.playSound('powerup');
                this.updateUI();
            }
        });
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    createExplosion(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 4, 40, 1)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw background speed streaks using backgroundOffset
        this.drawBackground(this.ctx);

        // Draw parallax stars with varying sizes
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.brightness;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.globalAlpha = 1;
        
        if (this.gameState === 'playing' || this.gameState === 'paused') {
            // Draw game objects
            this.player.render(this.ctx);
            
            this.bullets.forEach(bullet => bullet.render(this.ctx));
            this.enemies.forEach(enemy => enemy.render(this.ctx));
            this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
            this.particles.forEach(particle => particle.render(this.ctx));
        }
    }
    
    drawBackground(ctx) {
        // Subtle forward motion streaks and horizon bands
        const offset = this.backgroundOffset % this.height;

        // Horizon bands
            ctx.save();
        const bandHeight = 80;
        const grad = ctx.createLinearGradient(0, this.height - bandHeight, 0, this.height);
        grad.addColorStop(0, 'rgba(0, 20, 80, 0.0)');
        grad.addColorStop(1, 'rgba(0, 40, 120, 0.25)');
                ctx.fillStyle = grad;
        ctx.fillRect(0, this.height - bandHeight, this.width, bandHeight);

        // Moving streak lines - removed per user request
            ctx.restore();
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('levelValue').textContent = this.level;
        document.getElementById('weaponType').textContent = this.player.weaponType;
        
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthFill').style.width = healthPercent + '%';
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Skip update/render if paused by debug panel
        if (!this.isPaused) {
        this.update(this.deltaTime);
        this.render();
        } else {
            // Still render when paused so we can see the paused state
            this.render();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Player class
class Player {
    constructor(x, y, dataStore = null) {
        this.x = x;
        this.y = y;
        this.dataStore = dataStore || window.game?.dataStore;
        
        // Get player stats from Bookwormy Guy
        const playerStats = this.dataStore ? this.dataStore.getPlayerBaseStats() : null;
        const config = this.dataStore ? this.dataStore.getGameConfig() : null;
        
        this.width = 40;
        this.height = 40;
        this.speed = playerStats ? playerStats.baseSpeed : 300;
        this.health = playerStats ? playerStats.baseHealth : 100;
        this.maxHealth = playerStats ? playerStats.maxHealth : 100;
        
        // Weapon system - map game weapons to Bookwormy Guy weapons
        this.weaponMap = {
            'pulse': 'pistol',      // Pulse Cannon -> Pistol
            'laser': 'laser',       // Laser Beam -> Laser Rifle
            'spread': 'shotgun',    // Spread Shot -> Shotgun
            'homing': 'bazooka'     // Homing Missile -> Bazooka (closest match)
        };
        
        this.currentWeapon = 0; // Index of current weapon
        this.weapons = ['pulse', 'laser', 'spread', 'homing'];
        this.weaponLevel = 1;
        this.lastShot = 0;
        
        // Initialize default weapon stats (fallback if Bookwormy Guy fails)
        this.fireRate = 200; // milliseconds
        this.weaponType = 'Pulse Cannon';
        this.weaponDamage = 20;
        this.weaponProjectiles = 1;
        
        // Get initial weapon stats from Bookwormy Guy
        this.updateWeaponStats();
        this.specialWeaponCooldown = 0;
        this.specialWeaponMaxCooldown = 5000; // 5 seconds
        this.upgrades = {
            speed: 1,
            health: 1,
            fireRate: 1,
            damage: 1
        };
    }
    
    updateWeaponStats() {
        // Get current weapon stats from Bookwormy Guy
        if (!this.dataStore) return;
        
        const weaponKey = this.weapons[this.currentWeapon];
        const bookwormyWeapon = this.weaponMap[weaponKey];
        
        if (bookwormyWeapon) {
            // try {
            //     telemetry.logEvent('weapon_stats_request', 'Player', {
            //         weaponKey,
            //         mappedWeapon: bookwormyWeapon,
            //         level: this.weaponLevel,
            //     });
            // } catch (e) {}

            let weaponData = null;
            try {
                weaponData = this.dataStore.getWeapon(bookwormyWeapon, this.weaponLevel);
            } catch (err) {
                try { telemetry.logError('Player', err); } catch (e) {}
            }

            if (weaponData) {
                this.fireRate = weaponData.fireRate;
                this.weaponDamage = weaponData.damage;
                this.weaponType = weaponData.name;
                this.weaponProjectiles = weaponData.projectiles || 1;
                this.weaponBulletSpeed = weaponData.bulletSpeed;
                this.weaponBulletColor = weaponData.bulletColor;
            }

            // // Proof in event log: always show what we got back (including null)
            // try {
            //     telemetry.logEvent('weapon_stats_loaded', 'Player', {
            //         weaponKey,
            //         mappedWeapon: bookwormyWeapon,
            //         level: this.weaponLevel,
            //         weaponDataNull: !weaponData,
            //         projectiles: this.weaponProjectiles,
            //         fireRate: this.fireRate,
            //         bulletColor: this.weaponBulletColor,
            //     });
            // } catch (e) {}
        }
    }

    /**
     * Edge-triggered weapon switch (invoked from Game keydown)
     * Ensures we always refresh BookwormyGuy stats and emit proof events.
     */
    switchWeapon(slot, weaponKey, code = null) {
        const indexMap = { pulse: 0, laser: 1, spread: 2, homing: 3 };
        const nextIndex = indexMap[weaponKey];
        if (nextIndex === undefined) return;
        if (this.currentWeapon === nextIndex) return;

        this.currentWeapon = nextIndex;

        const mappedWeapon = this.weaponMap[weaponKey];
        try {
            telemetry.logEvent('weapon_switch', 'Player', {
                slot,
                weaponKey,
                mappedWeapon,
                level: this.weaponLevel,
                code,
            });
        } catch (e) {}

        // Always update stats from BookwormyGuy on switch
        this.updateWeaponStats();

        // Pull visuals too (and have it show up in telemetry calls)
        if (this.dataStore && mappedWeapon) {
            try {
                this.dataStore.getWeaponVisualData(mappedWeapon);
            } catch (e) {}
        }

        // try {
        //     telemetry.logEvent('weapon_switch_effective', 'Player', {
        //         slot,
        //         weaponKey,
        //         mappedWeapon,
        //         level: this.weaponLevel,
        //         projectiles: this.weaponProjectiles,
        //         fireRate: this.fireRate,
        //         weaponTypeName: this.weaponType,
        //     });
        // } catch (e) {}
    }
    
    update(deltaTime, keys) {
        // Apply speed upgrades
        const currentSpeed = this.speed * this.upgrades.speed;
        
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
        
        // Keep player in bounds
        this.x = Math.max(0, Math.min(this.x, game.width - this.width));
        this.y = Math.max(0, Math.min(this.y, game.height - this.height));
        
        // Weapon switching is handled on keydown in Game.setupEventListeners()
        // (edge-triggered, guaranteed BookwormyGuy stat refresh + telemetry proof events)

        // Shooting
        if (keys['Space'] || keys['KeyZ']) {
            this.shoot();
        }
        
        // Special weapon
        if (keys['KeyX']) {
            this.useSpecialWeapon();
        }
        
        // Update special weapon cooldown
        if (this.specialWeaponCooldown > 0) {
            this.specialWeaponCooldown -= deltaTime;
        }
    }
    
    shoot() {
        const now = Date.now();
        const fireRate = this.fireRate / this.upgrades.fireRate;
        
        if (now - this.lastShot > fireRate) {
            const weaponType = this.weapons[this.currentWeapon];
            
            // Weapon stats are refreshed on weapon switch + upgrade (see updateWeaponStats()).
            // Using cached local values here keeps telemetry clean and avoids unnecessary calls.
            const projectiles = this.weaponProjectiles || 1;
            
            switch (weaponType) {
                case 'pulse':
                    // Use projectiles from Bookwormy Guy
                    if (projectiles === 1) {
                        game.bullets.push(new Bullet(this.x + this.width/2, this.y, 'player', 'pulse'));
                    } else if (projectiles === 2) {
                        game.bullets.push(new Bullet(this.x + this.width/2 - 10, this.y, 'player', 'pulse'));
                        game.bullets.push(new Bullet(this.x + this.width/2 + 10, this.y, 'player', 'pulse'));
                    } else {
                        // 3+ projectiles
                        game.bullets.push(new Bullet(this.x + this.width/2, this.y, 'player', 'pulse'));
                        for (let i = 1; i < projectiles; i++) {
                            const offset = (i - 1) * 15 - (projectiles - 2) * 7.5;
                            game.bullets.push(new Bullet(this.x + this.width/2 + offset, this.y + 10, 'player', 'pulse'));
                        }
                    }
                    break;
                case 'laser':
                    // Single powerful laser
                    game.bullets.push(new Bullet(this.x + this.width/2, this.y, 'player', 'laser'));
                    break;
                case 'spread':
                    // Wide spread shot - horizontal line of bullets
                    // Use projectiles from Bookwormy Guy (should be 5 for shotgun), fallback to 5
                    const spreadCount = projectiles >= 1 ? projectiles : 5;
                    // Original pattern: 5 bullets in horizontal line (i = -2, -1, 0, 1, 2)
                    // For different counts, center them around 0
                    const halfSpread = Math.floor(spreadCount / 2);
                    for (let i = -halfSpread; i <= halfSpread; i++) {
                        if (spreadCount % 2 === 0 && i === 0) continue; // Skip center for even counts
                        game.bullets.push(new Bullet(this.x + this.width/2 + i * 8, this.y, 'player', 'spread'));
                    }
                    break;
                case 'homing':
                    // Homing missiles - use projectiles from Bookwormy Guy
                    for (let i = 0; i < projectiles; i++) {
                        const homingBullet = new Bullet(
                            this.x + this.width/2 + (i - (projectiles - 1) / 2) * 10, 
                            this.y, 
                            'player', 
                            'homing'
                        );
                        homingBullet.target = this.findNearestEnemy();
                        game.bullets.push(homingBullet);
                    }
                    break;
            }
            game.playSound('shoot');
            this.lastShot = now;
        }
    }
    
    findNearestEnemy() {
        let nearest = null;
        let minDistance = Infinity;
        
        game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        });
        
        return nearest;
    }
    
    useSpecialWeapon() {
        if (this.specialWeaponCooldown <= 0) {
            // Launch a barrage of homing missiles
            for (let i = 0; i < 5; i++) {
                const missile = new Bullet(this.x + this.width/2 + (i - 2) * 10, this.y, 'player', 'homing');
                missile.target = this.findNearestEnemy();
                game.bullets.push(missile);
            }
            this.specialWeaponCooldown = this.specialWeaponMaxCooldown;
            game.playSound('shoot');
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    upgradeWeapon() {
        if (this.weaponLevel < 5) {
            this.weaponLevel++;
            // Update weapon stats from Bookwormy Guy after upgrade
            this.updateWeaponStats();
        }
    }
    
    upgradeShip(upgradeType) {
        switch (upgradeType) {
            case 'speed':
                this.upgrades.speed = Math.min(2.5, this.upgrades.speed + 0.3);
                break;
            case 'health':
                this.upgrades.health += 0.5;
                this.maxHealth = Math.floor(100 * this.upgrades.health);
                this.health = Math.min(this.maxHealth, this.health + 50);
                break;
            case 'fireRate':
                this.upgrades.fireRate = Math.min(3, this.upgrades.fireRate + 0.5);
                break;
            case 'damage':
                this.upgrades.damage = Math.min(2.5, this.upgrades.damage + 0.3);
                break;
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw engine trails
        this.drawEngineTrails(ctx);
        
        // Draw ship shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // Draw ship body with gradient
        const bodyGradient = ctx.createLinearGradient(this.x + 10, this.y + 10, this.x + 30, this.y + 40);
        bodyGradient.addColorStop(0, '#00ff88');
        bodyGradient.addColorStop(0.5, '#00cc44');
        bodyGradient.addColorStop(1, '#008822');
        ctx.fillStyle = bodyGradient;
        ctx.fillRect(this.x + 10, this.y + 10, 20, 30);
        
        // Draw ship wings with gradient
        const wingGradient = ctx.createLinearGradient(this.x, this.y + 20, this.x + 40, this.y + 35);
        wingGradient.addColorStop(0, '#00aa22');
        wingGradient.addColorStop(0.5, '#00cc44');
        wingGradient.addColorStop(1, '#006611');
        ctx.fillStyle = wingGradient;
        ctx.fillRect(this.x, this.y + 20, 10, 15);
        ctx.fillRect(this.x + 30, this.y + 20, 10, 15);
        
        // Draw ship cockpit with glow
        ctx.fillStyle = '#88ff88';
        ctx.fillRect(this.x + 15, this.y + 5, 10, 10);
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(this.x + 16, this.y + 6, 8, 8);
        
        // Draw engine glow with pulsing effect
        const pulseIntensity = 0.8 + 0.2 * Math.sin(Date.now() / 100);
        ctx.fillStyle = `rgba(0, 136, 255, ${pulseIntensity})`;
        ctx.fillRect(this.x + 12, this.y + 35, 6, 8);
        ctx.fillRect(this.x + 22, this.y + 35, 6, 8);
        
        // Upgrade-driven visual changes
        this.drawUpgradeAccents(ctx);

        // Draw ship outline - traced around the actual shape
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'square';
        this.drawTracedOutline(ctx);
        
        ctx.restore();
    }
    
    drawEngineTrails(ctx) {
        // Draw engine particle trails
        for (let i = 0; i < 3; i++) {
            const trailX = this.x + 15 + i * 5;
            const trailY = this.y + 40 + Math.random() * 10;
            const trailSize = Math.random() * 3 + 1;
            const trailAlpha = Math.random() * 0.6 + 0.2;
            
            ctx.fillStyle = `rgba(0, 136, 255, ${trailAlpha})`;
            ctx.fillRect(trailX, trailY, trailSize, trailSize);
        }
    }

    drawUpgradeAccents(ctx) {
        // Speed upgrades: longer engines and side fins
        if (this.upgrades.speed > 1.1) {
            const extra = Math.min(10, Math.floor((this.upgrades.speed - 1) * 8));
            ctx.fillStyle = 'rgba(0, 180, 255, 0.7)';
            ctx.fillRect(this.x + 12, this.y + 35, 6, 8 + extra);
            ctx.fillRect(this.x + 22, this.y + 35, 6, 8 + extra);

            // Side fins
            ctx.fillStyle = '#00bb44';
            ctx.fillRect(this.x - 3, this.y + 22, 3, 12);
            ctx.fillRect(this.x + this.width, this.y + 22, 3, 12);
        }

        // Fire rate upgrades: add top vents
        if (this.upgrades.fireRate > 1.1) {
            ctx.fillStyle = '#228844';
            ctx.fillRect(this.x + 13, this.y + 10, 3, 6);
            ctx.fillRect(this.x + 24, this.y + 10, 3, 6);
        }

        // Damage upgrades: red nose accents
        if (this.upgrades.damage > 1.1) {
            ctx.fillStyle = '#ff3355';
            ctx.fillRect(this.x + 18, this.y + 3, 4, 6);
        }

        // Weapon level 3: add nose cone
        if (this.weaponLevel >= 3) {
            ctx.fillStyle = '#22ff99';
            ctx.fillRect(this.x + 17, this.y + 2, 6, 4);
        }
    }
    
    drawTracedOutline(ctx) {
        // Trace around the actual ship shape (body, wings, cockpit)
        // Player ship: body (x+10, y+10, 20x30), left wing (x, y+20, 10x15), 
        // right wing (x+30, y+20, 10x15), cockpit (x+15, y+5, 10x10)
        // Trace exact outer perimeter
        
        const bx = this.x + 10;  // body x
        const by = this.y + 10;  // body y
        const bw = 20;            // body width
        const bh = 30;            // body height
        
        const lwx = this.x;       // left wing x
        const lwy = this.y + 20; // left wing y
        const lww = 10;           // left wing width
        const lwh = 15;           // left wing height
        
        const rwx = this.x + 30; // right wing x
        const rwy = this.y + 20;  // right wing y
        const rww = 10;           // right wing width
        const rwh = 15;           // right wing height
        
        const cx = this.x + 15;   // cockpit x
        const cy = this.y + 5;   // cockpit y
        const cw = 10;            // cockpit width
        
        ctx.beginPath();
        
        // Start from top-left of cockpit
        ctx.moveTo(cx, cy);
        // Top of cockpit
        ctx.lineTo(cx + cw, cy);
        // Top-right of cockpit to top-right of body
        ctx.lineTo(bx + bw, by);
        // Right side of body down to where right wing starts
        ctx.lineTo(bx + bw, rwy);
        // Top of right wing (outer edge)
        ctx.lineTo(rwx + rww, rwy);
        // Right side of right wing
        ctx.lineTo(rwx + rww, rwy + rwh);
        // Bottom of right wing
        ctx.lineTo(rwx, rwy + rwh);
        // Left side of right wing (inner edge) back to body
        ctx.lineTo(bx + bw, rwy + rwh);
        // Continue down right side of body
        ctx.lineTo(bx + bw, by + bh);
        // Bottom of body
        ctx.lineTo(bx, by + bh);
        // Left side of body up to where left wing ends
        ctx.lineTo(bx, rwy + rwh);
        // Left side of left wing (inner edge)
        ctx.lineTo(lwx + lww, rwy + rwh);
        // Bottom of left wing
        ctx.lineTo(lwx, rwy + rwh);
        // Left side of left wing
        ctx.lineTo(lwx, rwy);
        // Top of left wing (outer edge)
        ctx.lineTo(lwx + lww, rwy);
        // Back to top-left of body
        ctx.lineTo(bx, by);
        // Back to top-left of cockpit
        ctx.lineTo(cx, cy);
        
        ctx.closePath();
        ctx.stroke();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'basic', player = null, dataStore = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.player = player;
        // Enemy gets the cached dataStore from Game (shares Game's cache)
        this.dataStore = dataStore || window.game?.dataStore;
        
        // Initialize defaults
        this.speed = 100;
        this.health = 30;
        this.maxHealth = 30;
        this.points = 100;
        this.fireRate = 1000;
        this.width = 30;
        this.height = 30;
        this.lastShot = 0;
        this.movePattern = 0;
        this.moveTimer = 0;
        this.angle = 0;
        this.radius = 0;
        this.direction = 1;
        this.aggressionLevel = 1;
        this.tier = 'medium';
        
        // Get enemy data from Bookwormy Guy
        if (this.dataStore) {
            const enemyData = this.dataStore.getEnemyType(type);
            if (enemyData) {
                // Map Bookwormy Guy data to Enemy properties
                this.speed = enemyData.baseSpeed || this.speed;
                this.health = enemyData.health || this.health;
                this.maxHealth = enemyData.health || this.maxHealth;
                this.points = enemyData.points || this.points;
                this.fireRate = enemyData.fireRate || this.fireRate;
                this.width = enemyData.width || this.width;
                this.height = enemyData.height || this.height;
                this.radius = enemyData.radius || this.radius;
                
                // Derive tier from type name
                if (type.startsWith('elite_')) {
                    this.tier = 'elite';
                    this.aggressionLevel = 3;
                } else if (['heavy', 'hunter', 'bomber', 'turret', 'spiral'].includes(type)) {
                    this.tier = 'strong';
                    this.aggressionLevel = type === 'hunter' || type === 'turret' ? 3 : 2;
                } else if (['fast', 'zigzag', 'sidewinder'].includes(type)) {
                    this.tier = 'medium';
                    this.aggressionLevel = type === 'fast' || type === 'sidewinder' ? 2 : 1;
                } else if (['scout', 'fighter'].includes(type)) {
                    this.tier = 'weak';
                    this.aggressionLevel = type === 'fighter' ? 2 : 1;
                }
            } else {
                // Fallback for 'drone' type that doesn't exist in Bookwormy Guy yet
                if (type === 'drone') {
                    this.speed = 100;
                    this.health = 15;
                    this.maxHealth = 15;
                    this.points = 75;
                    this.width = 18;
                    this.height = 18;
                    this.fireRate = 1200;
                    this.aggressionLevel = 1;
                    this.tier = 'weak';
                }
            }
        }
    }
    
    update(deltaTime) {
        this.moveTimer += deltaTime;
        
        // Movement patterns
        switch (this.type) {
            // Weak enemies
            case 'scout':
            this.y += this.speed * deltaTime / 1000;
                this.x += Math.sin(this.moveTimer / 300) * 2;
                break;
            case 'drone':
                this.y += this.speed * deltaTime / 1000;
                this.x += Math.cos(this.moveTimer / 400) * 1.5;
                break;
            case 'fighter':
                this.y += this.speed * deltaTime / 1000;
                this.x += Math.sin(this.moveTimer / 250) * 2.5;
                break;
            // Medium enemies
            case 'fast':
                this.y += this.speed * deltaTime / 1000;
                this.x += Math.sin(this.moveTimer / 200) * 3;
                break;
            case 'zigzag':
                this.y += this.speed * deltaTime / 1000;
                this.x += Math.sin(this.moveTimer / 300) * 4;
                break;
            case 'sidewinder':
            this.y += this.speed * deltaTime / 1000 * 0.3;
            this.x += Math.sin(this.moveTimer / 150) * 5;
                break;
            // Strong enemies
            case 'heavy':
                this.y += this.speed * deltaTime / 1000;
                break;
            case 'hunter':
            case 'elite_hunter':
                // Hunt the player - move towards player position
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
                break;
            case 'bomber':
            case 'elite_bomber':
                this.y += this.speed * deltaTime / 1000;
                this.x += Math.sin(this.moveTimer / 400) * 2;
                break;
            case 'spiral':
            case 'elite_spiral':
                // Spiral movement pattern
            this.angle += deltaTime / 100;
            this.radius += deltaTime / 500;
            const centerX = game.width / 2;
            this.x = centerX + Math.cos(this.angle) * this.radius;
            this.y += this.speed * deltaTime / 1000 * 0.5;
                break;
            case 'turret':
                // Move with background scrolling so it appears attached to terrain
                {
                    const speedBoost = this.player ? (this.player.upgrades?.speed || 1) : 1;
                    this.y += (game.scrollSpeed * 0.6 * speedBoost) * deltaTime / 1000;
                }
                break;
            default: // basic
            this.y += this.speed * deltaTime / 1000;
            this.x += Math.sin(this.moveTimer / 500) * 1;
        }
        
        // Keep in bounds horizontally
        this.x = Math.max(0, Math.min(this.x, game.width - this.width));
        
        // Shooting based on aggression level and type
        const shootChance = this.aggressionLevel * 0.0005;
            if (Math.random() < shootChance && this.y > 50) {
                this.shoot();
        }
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.fireRate) {
            switch (this.type) {
                // Weak enemies
                case 'scout':
                case 'drone':
                case 'fighter':
                    game.bullets.push(new Bullet(this.x + this.width/2, this.y + this.height, 'enemy', 'basic'));
                    break;
                // Medium enemies
                case 'fast':
                    game.bullets.push(new Bullet(this.x + this.width/2, this.y + this.height, 'enemy', 'fast'));
                    break;
                case 'zigzag':
                    // Double shot
                    game.bullets.push(new Bullet(this.x + this.width/2 - 8, this.y + this.height, 'enemy', 'basic'));
                    game.bullets.push(new Bullet(this.x + this.width/2 + 8, this.y + this.height, 'enemy', 'basic'));
                    break;
                case 'sidewinder':
                    // Side shots
                    game.bullets.push(new Bullet(this.x, this.y + this.height/2, 'enemy', 'basic'));
                    game.bullets.push(new Bullet(this.x + this.width, this.y + this.height/2, 'enemy', 'basic'));
                    break;
                // Strong enemies
                case 'bomber':
                    // Drop multiple bombs in a spread
                    for (let i = -1; i <= 1; i++) {
                        game.bullets.push(new Bullet(
                            this.x + this.width/2 + i * 15, 
                            this.y + this.height, 
                            'enemy', 
                            'bomb'
                        ));
                    }
                    break;
                case 'heavy':
                    // Triple shot
                    for (let i = -1; i <= 1; i++) {
                        game.bullets.push(new Bullet(
                            this.x + this.width/2 + i * 20, 
                            this.y + this.height, 
                            'enemy', 
                            'heavy'
                        ));
                    }
                    break;
                case 'hunter':
                    // Homing shot
                    const homingBullet = new Bullet(
                        this.x + this.width/2, 
                        this.y + this.height, 
                        'enemy', 
                        'homing'
                    );
                    homingBullet.target = this.player;
                    game.bullets.push(homingBullet);
                    break;
            case 'turret':
                {
                    const tBullet = new Bullet(
                        this.x + this.width/2,
                        this.y + this.height/2,
                        'enemy',
                        'homing'
                    );
                    tBullet.target = this.player;
                    game.bullets.push(tBullet);
                    }
                    break;
                case 'spiral':
                    // Spiral shot pattern
                    for (let i = 0; i < 3; i++) {
                        game.bullets.push(new Bullet(
                            this.x + this.width/2, 
                            this.y + this.height, 
                            'enemy', 
                            'spiral',
                            i * Math.PI * 2 / 3
                        ));
                    }
                    break;
                // Elite enemies
                case 'elite_hunter':
                    // Double homing shots
                    for (let i = 0; i < 2; i++) {
                        const eliteHomingBullet = new Bullet(
                            this.x + this.width/2 + (i - 0.5) * 10, 
                            this.y + this.height, 
                            'enemy', 
                            'homing'
                        );
                        eliteHomingBullet.target = this.player;
                        game.bullets.push(eliteHomingBullet);
                    }
                    break;
                case 'elite_bomber':
                    // Massive bomb spread
                    for (let i = -2; i <= 2; i++) {
                        game.bullets.push(new Bullet(
                            this.x + this.width/2 + i * 12, 
                            this.y + this.height, 
                            'enemy', 
                            'bomb'
                        ));
                    }
                    break;
                case 'elite_spiral':
                    // Enhanced spiral pattern
                    for (let i = 0; i < 5; i++) {
                        game.bullets.push(new Bullet(
                            this.x + this.width/2, 
                            this.y + this.height, 
                            'enemy', 
                            'spiral',
                            i * Math.PI * 2 / 5
                        ));
                    }
                    break;
                default:
                    game.bullets.push(new Bullet(this.x + this.width/2, this.y + this.height, 'enemy'));
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
        
        // Draw shadow based on tier
        const shadowAlpha = this.tier === 'elite' ? 0.4 : this.tier === 'strong' ? 0.3 : 0.2;
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.fillRect(this.x + 2, this.y + 2, this.width, this.height);
        
        // Draw based on type and tier
        switch (this.type) {
            // Weak enemies
            case 'scout':
                this.drawScout(ctx);
                break;
            case 'drone':
                this.drawDrone(ctx);
                break;
            case 'fighter':
                this.drawFighter(ctx);
                break;
            // Medium enemies
            case 'fast':
                this.drawFast(ctx);
                break;
            case 'zigzag':
                this.drawZigzag(ctx);
                break;
            case 'sidewinder':
                this.drawSidewinder(ctx);
                break;
            // Strong enemies
            case 'heavy':
                this.drawHeavy(ctx);
                break;
            case 'hunter':
                this.drawHunter(ctx);
                break;
            case 'turret':
                this.drawTurret(ctx);
                break;
            case 'bomber':
                this.drawBomber(ctx);
                break;
            case 'spiral':
                this.drawSpiral(ctx);
                break;
            // Elite enemies
            case 'elite_hunter':
                this.drawEliteHunter(ctx);
                break;
            case 'elite_bomber':
                this.drawEliteBomber(ctx);
                break;
            case 'elite_spiral':
                this.drawEliteSpiral(ctx);
                break;
            default: // basic
                this.drawBasic(ctx);
        }
        
        // Draw tier indicator
        this.drawTierIndicator(ctx);
        
        // Health bar for damaged enemies
        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
        
        ctx.restore();
    }
    
    drawTierIndicator(ctx) {
        if (this.tier === 'elite') {
            // Elite enemies get a golden glow - traced around actual shape
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'miter';
            ctx.lineCap = 'square';
            this.drawTracedOutline(ctx);
        }
    }
    
    drawTracedOutline(ctx) {
        // Trace around the actual enemy shape based on type
        // This creates a path that follows the exact outer edges of the drawn rectangles
        // Account for line width by offsetting by half the line width
        const lineOffset = (ctx.lineWidth || 1) / 2;
        ctx.beginPath();
        
        switch (this.type) {
            case 'scout':
                // Scout: main body (x+2, y+2, 16x16) and wings (x, y+6, 20x8)
                // Trace exact outer perimeter of both rectangles
                // Wings: (x, y+6, 20, 8) - goes from y+6 to y+14
                // Body: (x+2, y+2, 16, 16) - goes from y+2 to y+18, x+2 to x+18
                ctx.moveTo(this.x, this.y + 6);                    // Top-left of wings
                ctx.lineTo(this.x + 20, this.y + 6);              // Top-right of wings
                ctx.lineTo(this.x + 20, this.y + 14);             // Bottom-right of wings
                ctx.lineTo(this.x + 18, this.y + 14);             // Bottom-right of wings to body edge
                ctx.lineTo(this.x + 18, this.y + 18);             // Bottom-right of body
                ctx.lineTo(this.x + 2, this.y + 18);              // Bottom-left of body
                ctx.lineTo(this.x + 2, this.y + 14);               // Bottom-left of body to wings edge
                ctx.lineTo(this.x, this.y + 14);                   // Bottom-left of wings
                ctx.closePath();
                break;
                
            case 'drone':
                // Drone: outer (x+1, y+1, 16x16) - trace around the square
                ctx.moveTo(this.x + 1, this.y + 1);
                ctx.lineTo(this.x + 17, this.y + 1);
                ctx.lineTo(this.x + 17, this.y + 17);
                ctx.lineTo(this.x + 1, this.y + 17);
                ctx.closePath();
                break;
                
            case 'fighter':
                // Fighter: main body (x+2, y+2, 21x21) and wings (x, y+8, 25x10)
                // Body: (x+2, y+2, 21, 21) - goes to x+23, y+23
                // Wings: (x, y+8, 25, 10) - goes to x+25, y+18
                ctx.moveTo(this.x, this.y + 8);                    // Top-left of wings
                ctx.lineTo(this.x + 25, this.y + 8);              // Top-right of wings
                ctx.lineTo(this.x + 25, this.y + 18);             // Bottom-right of wings
                ctx.lineTo(this.x + 23, this.y + 18);             // Bottom-right of wings to body edge
                ctx.lineTo(this.x + 23, this.y + 23);             // Bottom-right of body
                ctx.lineTo(this.x + 2, this.y + 23);              // Bottom-left of body
                ctx.lineTo(this.x + 2, this.y + 18);               // Bottom-left of body to wings edge
                ctx.lineTo(this.x, this.y + 18);                   // Bottom-left of wings
                ctx.closePath();
                break;
                
            case 'fast':
                // Fast: body (x+5, y, 15x25) and wings (x, y+10, 25x10)
                // Body: (x+5, y, 15, 25) - goes to x+20, y+25
                // Wings: (x, y+10, 25, 10) - goes to x+25, y+20
                // Engine glow: (x+8, y+20, 4, 8) and (x+13, y+20, 4, 8) - part of body, ignore for outline
                ctx.moveTo(this.x, this.y + 10);                   // Top-left of wings
                ctx.lineTo(this.x + 25, this.y + 10);             // Top-right of wings
                ctx.lineTo(this.x + 25, this.y + 20);             // Bottom-right of wings
                ctx.lineTo(this.x + 20, this.y + 20);             // Bottom-right of wings to body edge
                ctx.lineTo(this.x + 20, this.y + 25);             // Bottom-right of body
                ctx.lineTo(this.x + 5, this.y + 25);              // Bottom-left of body
                ctx.lineTo(this.x + 5, this.y + 20);               // Bottom-left of body to wings edge
                ctx.lineTo(this.x, this.y + 20);                   // Bottom-left of wings
                ctx.closePath();
                break;
                
            case 'zigzag':
                // Zigzag: body (x+5, y, 20x30) and wings (x, y+12, 30x8) and top (x+8, y+5, 14x6)
                // Body: (x+5, y, 20, 30) - goes to x+25, y+30
                // Wings: (x, y+12, 30, 8) - goes to x+30, y+20
                // Top: (x+8, y+5, 14, 6) - goes to x+22, y+11 (inside wings, ignore for outer outline)
                ctx.moveTo(this.x, this.y + 12);                   // Top-left of wings
                ctx.lineTo(this.x + 30, this.y + 12);             // Top-right of wings
                ctx.lineTo(this.x + 30, this.y + 20);             // Bottom-right of wings
                ctx.lineTo(this.x + 25, this.y + 20);             // Bottom-right of wings to body edge
                ctx.lineTo(this.x + 25, this.y + 30);             // Bottom-right of body
                ctx.lineTo(this.x + 5, this.y + 30);              // Bottom-left of body
                ctx.lineTo(this.x + 5, this.y + 20);               // Bottom-left of body to wings edge
                ctx.lineTo(this.x, this.y + 20);                   // Bottom-left of wings
                ctx.closePath();
                break;
                
            case 'sidewinder':
                // Sidewinder: body (x+6, y, 16x28) and wings (x+1, y+10, 26x10)
                ctx.moveTo(this.x + 1, this.y + 10);
                ctx.lineTo(this.x + 27, this.y + 10);
                ctx.lineTo(this.x + 27, this.y + 20);
                ctx.lineTo(this.x + 22, this.y + 20);
                ctx.lineTo(this.x + 22, this.y + 28);
                ctx.lineTo(this.x + 6, this.y + 28);
                ctx.lineTo(this.x + 6, this.y + 20);
                ctx.lineTo(this.x + 1, this.y + 20);
                ctx.closePath();
                break;
                
            case 'heavy':
                // Heavy: body (x+10, y, 30x40) and wings (x, y+15, 50x20)
                ctx.moveTo(this.x, this.y + 15);
                ctx.lineTo(this.x + 50, this.y + 15);
                ctx.lineTo(this.x + 50, this.y + 35);
                ctx.lineTo(this.x + 40, this.y + 35);
                ctx.lineTo(this.x + 40, this.y + 40);
                ctx.lineTo(this.x + 10, this.y + 40);
                ctx.lineTo(this.x + 10, this.y + 35);
                ctx.lineTo(this.x, this.y + 35);
                ctx.closePath();
                break;
                
            case 'hunter':
            case 'elite_hunter':
                // Hunter: body (x+7, y, 21x35) and wings (x+2, y+12, 31x12)
                ctx.moveTo(this.x + 2, this.y + 12);
                ctx.lineTo(this.x + 33, this.y + 12);
                ctx.lineTo(this.x + 33, this.y + 24);
                ctx.lineTo(this.x + 28, this.y + 24);
                ctx.lineTo(this.x + 28, this.y + 35);
                ctx.lineTo(this.x + 7, this.y + 35);
                ctx.lineTo(this.x + 7, this.y + 24);
                ctx.lineTo(this.x + 2, this.y + 24);
                ctx.closePath();
                break;
                
            case 'bomber':
            case 'elite_bomber':
                // Bomber: body (x+7, y, 31x45) and wings (x+2, y+20, 41x15)
                const bomberHeight = this.type === 'elite_bomber' ? 55 : 45;
                const bomberWingY = this.type === 'elite_bomber' ? 20 : 20;
                ctx.moveTo(this.x + 2, this.y + bomberWingY);
                ctx.lineTo(this.x + 43, this.y + bomberWingY);
                ctx.lineTo(this.x + 43, this.y + bomberWingY + 15);
                ctx.lineTo(this.x + 38, this.y + bomberWingY + 15);
                ctx.lineTo(this.x + 38, this.y + bomberHeight);
                ctx.lineTo(this.x + 7, this.y + bomberHeight);
                ctx.lineTo(this.x + 7, this.y + bomberWingY + 15);
                ctx.lineTo(this.x + 2, this.y + bomberWingY + 15);
                ctx.closePath();
                break;
                
            case 'spiral':
            case 'elite_spiral':
                // Spiral: body (x+6, y, 20x32) and wings (x+1, y+14, 30x6)
                const spiralHeight = this.type === 'elite_spiral' ? 38 : 32;
                ctx.moveTo(this.x + 1, this.y + 14);
                ctx.lineTo(this.x + 31, this.y + 14);
                ctx.lineTo(this.x + 31, this.y + 20);
                ctx.lineTo(this.x + 26, this.y + 20);
                ctx.lineTo(this.x + 26, this.y + spiralHeight);
                ctx.lineTo(this.x + 6, this.y + spiralHeight);
                ctx.lineTo(this.x + 6, this.y + 20);
                ctx.lineTo(this.x + 1, this.y + 20);
                ctx.closePath();
                break;
                
            case 'turret':
                // Turret: base (x+2, y+10, width-4, height-12) and mount (x+8, y+6, width-16, 10)
                ctx.moveTo(this.x + 8, this.y + 6);
                ctx.lineTo(this.x + this.width - 8, this.y + 6);
                ctx.lineTo(this.x + this.width - 8, this.y + 16);
                ctx.lineTo(this.x + this.width - 2, this.y + 16);
                ctx.lineTo(this.x + this.width - 2, this.y + this.height - 2);
                ctx.lineTo(this.x + 2, this.y + this.height - 2);
                ctx.lineTo(this.x + 2, this.y + 16);
                ctx.lineTo(this.x + 8, this.y + 16);
                ctx.closePath();
                break;
                
            default: // basic
                // Basic: body (x+5, y, 20x30) and wings (x, y+10, 30x15)
                // Body: (x+5, y, 20, 30) - goes to x+25, y+30
                // Wings: (x, y+10, 30, 15) - goes to x+30, y+25
                ctx.moveTo(this.x, this.y + 10);                   // Top-left of wings
                ctx.lineTo(this.x + 30, this.y + 10);             // Top-right of wings
                ctx.lineTo(this.x + 30, this.y + 25);             // Bottom-right of wings
                ctx.lineTo(this.x + 25, this.y + 25);             // Bottom-right of wings to body edge
                ctx.lineTo(this.x + 25, this.y + 30);             // Bottom-right of body
                ctx.lineTo(this.x + 5, this.y + 30);              // Bottom-left of body
                ctx.lineTo(this.x + 5, this.y + 25);               // Bottom-left of body to wings edge
                ctx.lineTo(this.x, this.y + 25);                   // Bottom-left of wings
                ctx.closePath();
        }
        
        ctx.stroke();
    }
    
    drawHealthBar(ctx) {
            const healthPercent = this.health / this.maxHealth;
        const barHeight = 4;
        const barY = this.y - 8;
        
        // Background
            ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, barY, this.width, barHeight);
        
        // Health
            ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, barY, this.width * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, barY, this.width, barHeight);
    }
    
    // Enemy drawing methods
    drawScout(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#ffaaaa');
        gradient.addColorStop(1, '#ff6666');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 2, this.y + 2, 16, 16);
        
        ctx.fillStyle = '#ff8888';
        ctx.fillRect(this.x, this.y + 6, 20, 8);
    }
    
    drawDrone(ctx) {
        const gradient = ctx.createRadialGradient(this.x + 9, this.y + 9, 0, this.x + 9, this.y + 9, 9);
        gradient.addColorStop(0, '#aaaaff');
        gradient.addColorStop(1, '#6666ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 1, this.y + 1, 16, 16);
        
        ctx.fillStyle = '#8888ff';
        ctx.fillRect(this.x + 4, this.y + 4, 10, 10);
    }
    
    drawFighter(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#aaffaa');
        gradient.addColorStop(1, '#66ff66');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 2, this.y + 2, 21, 21);
        
        ctx.fillStyle = '#88ff88';
        ctx.fillRect(this.x, this.y + 8, 25, 10);
    }
    
    drawFast(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(1, '#cc0000');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 5, this.y, 15, 25);
        
        ctx.fillStyle = '#ff8888';
        ctx.fillRect(this.x, this.y + 10, 25, 10);
        
        // Engine glow
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 8, this.y + 20, 4, 8);
        ctx.fillRect(this.x + 13, this.y + 20, 4, 8);
    }
    
    drawZigzag(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#00aa44');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 5, this.y, 20, 30);
        
        ctx.fillStyle = '#44ffaa';
        ctx.fillRect(this.x, this.y + 12, 30, 8);
        
        ctx.fillStyle = '#00aa55';
        ctx.fillRect(this.x + 8, this.y + 5, 14, 6);
    }
    
    drawSidewinder(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#8800ff');
        gradient.addColorStop(1, '#4400aa');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 6, this.y, 16, 28);
        
        ctx.fillStyle = '#aa44ff';
        ctx.fillRect(this.x + 1, this.y + 10, 26, 10);
        
        ctx.fillStyle = '#6600cc';
        ctx.fillRect(this.x + 9, this.y + 4, 10, 8);
    }
    
    drawHeavy(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#8844ff');
        gradient.addColorStop(1, '#4422aa');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 10, this.y, 30, 40);
        
        ctx.fillStyle = '#aa88ff';
        ctx.fillRect(this.x, this.y + 15, 50, 20);
        
        ctx.fillStyle = '#4422aa';
        ctx.fillRect(this.x + 20, this.y + 5, 10, 10);
        
        // Armor plating
        ctx.fillStyle = '#221155';
        ctx.fillRect(this.x + 5, this.y + 10, 40, 5);
        ctx.fillRect(this.x + 5, this.y + 25, 40, 5);
    }
    
    drawHunter(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#ff0080');
        gradient.addColorStop(1, '#aa0044');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 7, this.y, 21, 35);
        
        ctx.fillStyle = '#ff44aa';
        ctx.fillRect(this.x + 2, this.y + 12, 31, 12);
        
        ctx.fillStyle = '#aa0044';
        ctx.fillRect(this.x + 12, this.y + 5, 11, 8);
        
        // Targeting system
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 15, this.y + 2, 5, 3);
    }
    
    drawBomber(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 7, this.y, 31, 45);
        
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.x + 2, this.y + 20, 41, 15);
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 17, this.y + 8, 11, 12);
        
        // Bomb bays
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 10, this.y + 35, 6, 8);
        ctx.fillRect(this.x + 24, this.y + 35, 6, 8);
    }
    
    drawSpiral(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#ffaa00');
        gradient.addColorStop(1, '#cc8800');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 6, this.y, 20, 32);
        
        ctx.fillStyle = '#ffcc44';
        ctx.fillRect(this.x + 1, this.y + 14, 30, 6);
        
        ctx.fillStyle = '#cc8800';
        ctx.fillRect(this.x + 10, this.y + 6, 12, 8);
        
        // Spiral indicator
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(this.x + 14, this.y + 2, 4, 4);
    }
    
    drawEliteHunter(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#ff0080');
        gradient.addColorStop(0.5, '#ff44aa');
        gradient.addColorStop(1, '#aa0044');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 5, this.y, 30, 40);
        
        ctx.fillStyle = '#ff44aa';
        ctx.fillRect(this.x, this.y + 12, 40, 12);
        
        ctx.fillStyle = '#aa0044';
        ctx.fillRect(this.x + 12, this.y + 5, 16, 8);
        
        // Enhanced targeting
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x + 15, this.y + 2, 8, 3);
        ctx.fillRect(this.x + 17, this.y, 4, 2);
    }
    
    drawEliteBomber(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 5, this.y, 45, 55);
        
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(this.x, this.y + 20, 55, 20);
        
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x + 20, this.y + 8, 15, 15);
        
        // Multiple bomb bays
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(this.x + 8 + i * 10, this.y + 45, 6, 8);
        }
    }
    
    drawEliteSpiral(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#ffaa00');
        gradient.addColorStop(0.5, '#ffcc44');
        gradient.addColorStop(1, '#cc8800');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 4, this.y, 30, 38);
        
        ctx.fillStyle = '#ffcc44';
        ctx.fillRect(this.x, this.y + 14, 38, 8);
        
        ctx.fillStyle = '#cc8800';
        ctx.fillRect(this.x + 12, this.y + 6, 14, 10);
        
        // Multiple spiral indicators
        ctx.fillStyle = '#ff6600';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(this.x + 12 + i * 6, this.y + 2, 3, 3);
        }
    }
    
    drawTurret(ctx) {
        // Base
        const baseGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        baseGrad.addColorStop(0, '#444a55');
        baseGrad.addColorStop(1, '#262a33');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(this.x + 2, this.y + 10, this.width - 4, this.height - 12);

        // Mount
        ctx.fillStyle = '#667080';
        ctx.fillRect(this.x + 8, this.y + 6, this.width - 16, 10);

        // Barrel pointing down toward player area
        ctx.fillStyle = '#99a6b8';
        ctx.fillRect(this.x + this.width/2 - 3, this.y + 2, 6, 18);

        // Lights
        ctx.fillStyle = '#ff3344';
        ctx.fillRect(this.x + 6, this.y + this.height - 8, 4, 4);
        ctx.fillRect(this.x + this.width - 10, this.y + this.height - 8, 4, 4);
    }
    
    drawBasic(ctx) {
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, '#ff8800');
        gradient.addColorStop(1, '#cc6600');
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + 5, this.y, 20, 30);
        
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(this.x, this.y + 10, 30, 15);
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
        this.width = 4;
        this.height = 8;
        this.damage = 25;
        this.vx = 0;
        this.vy = 0;
        this.target = null;
        this.life = 1.0;
        
        if (owner === 'player') {
            this.setupPlayerBullet();
        } else {
            this.setupEnemyBullet();
        }
    }
    
    setupPlayerBullet() {
        switch (this.type) {
            case 'pulse':
                this.speed = -500;
                this.color = '#00ffff';
                this.width = 6;
                this.height = 10;
                break;
            case 'laser':
                this.speed = -700;
                this.color = '#ff0080';
                this.width = 3;
                this.height = 15;
                this.damage = 40;
                break;
            case 'spread':
                this.speed = -400;
                this.color = '#ffff00';
                this.width = 4;
                this.height = 8;
                break;
            case 'homing':
                this.speed = -300;
                this.color = '#00ff00';
                this.width = 5;
                this.height = 8;
                this.damage = 35;
                break;
            default:
                this.speed = -500;
                this.color = '#00ffff';
        }
        this.vy = this.speed;
    }
    
    setupEnemyBullet() {
        switch (this.type) {
            case 'bomb':
                this.speed = 200;
                this.color = '#8B4513';
                this.width = 8;
                this.height = 8;
                this.damage = 40;
                break;
            case 'heavy':
                this.speed = 250;
                this.color = '#8844ff';
                this.width = 6;
                this.height = 12;
                this.damage = 30;
                break;
            case 'homing':
                this.speed = 180;
                this.color = '#ff0080';
                this.width = 5;
                this.height = 8;
                this.damage = 25;
                break;
            case 'spiral':
                this.speed = 150;
                this.color = '#ffaa00';
                this.width = 4;
                this.height = 6;
                this.damage = 20;
                break;
            case 'fast':
                this.speed = 400;
                this.color = '#ff4444';
                this.width = 3;
                this.height = 6;
                this.damage = 15;
                break;
            default:
                this.speed = 300;
                this.color = '#ff4444';
        }
            this.vy = this.speed;
            
        // Set up movement based on bullet type
            if (this.type === 'spiral') {
                this.vx = Math.cos(this.angle) * this.speed * 0.3;
                this.vy = Math.sin(this.angle) * this.speed * 0.3 + this.speed;
        }
    }
    
    update(deltaTime) {
        // Update position based on type
        switch (this.type) {
            case 'spiral':
                this.x += this.vx * deltaTime / 1000;
                this.y += this.vy * deltaTime / 1000;
                // Add spiral motion
                this.angle += deltaTime / 100;
                this.vx = Math.cos(this.angle) * this.speed * 0.3;
                break;
            case 'homing':
                if (this.target && this.target.health > 0) {
                    // Homing logic for both player and enemy bullets
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 0) {
                const homingForce = this.owner === 'player' ? 100 : 50;
                this.vx += (dx / distance) * homingForce * deltaTime / 1000;
                this.vy += (dy / distance) * homingForce * deltaTime / 1000;
                        // Limit speed
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > Math.abs(this.speed)) {
                    this.vx = (this.vx / speed) * Math.abs(this.speed);
                    this.vy = (this.vy / speed) * Math.abs(this.speed);
                }
            }
        } else {
                    // Fallback to straight movement if no target
            this.y += this.vy * deltaTime / 1000;
                }
                break;
            default:
                this.y += this.vy * deltaTime / 1000;
        }
        
        // Decay for certain bullet types
        if (this.type === 'bomb') {
            this.life -= deltaTime / 5000; // Bombs have limited life
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Special rendering for different bullet types
        switch (this.type) {
            case 'bomb':
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
                // Add fuse
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(this.x - 1, this.y - 3, 2, 3);
                break;
            case 'laser':
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
                // Add laser glow
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
                break;
            case 'spiral':
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.width/2, 0, this.width, this.height);
                break;
            default:
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
                // Add glow effect
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 5;
                ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// PowerUp class
// PowerUps are items that can be collected by the player to gain a benefit
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 100;
        this.rotation = 0;
        
        // Determine power-up type and tier
        const rand = Math.random();
        if (rand < 0.15) {
            this.type = 'weapon';
            this.tier = this.getRandomTier();
        } else if (rand < 0.3) {
            this.type = 'health';
            this.tier = this.getRandomTier();
        } else if (rand < 0.45) {
            this.type = 'speed';
            this.tier = this.getRandomTier();
        } else if (rand < 0.6) {
            this.type = 'fireRate';
            this.tier = this.getRandomTier();
        } else if (rand < 0.75) {
            this.type = 'damage';
            this.tier = this.getRandomTier();
        } else if (rand < 0.9) {
            this.type = 'shield';
            this.tier = this.getRandomTier();
        } else {
            this.type = 'multi';
            this.tier = 'legendary';
        }
        
        this.setupPowerUp();
    }
    
    getRandomTier() {
        const rand = Math.random();
        if (rand < 0.6) return 'basic';
        if (rand < 0.85) return 'enhanced';
        return 'legendary';
    }
    
    setupPowerUp() {
        switch (this.tier) {
            case 'basic':
                this.size = 16;
                this.glowIntensity = 0.3;
                break;
            case 'enhanced':
                this.size = 20;
                this.glowIntensity = 0.6;
                break;
            case 'legendary':
                this.size = 24;
                this.glowIntensity = 1.0;
                break;
        }
    }
    
    update(deltaTime) {
        this.y += this.speed * deltaTime / 1000;
        this.rotation += deltaTime / 100;
    }
    
    apply(player) {
        const multiplier = this.tier === 'basic' ? 1 : this.tier === 'enhanced' ? 1.5 : 2;
        
        switch (this.type) {
            case 'weapon':
                player.upgradeWeapon();
                break;
            case 'health':
                const healAmount = Math.floor(50 * multiplier);
                player.heal(healAmount);
                break;
            case 'speed':
                const speedBoost = 0.3 * multiplier;
                player.upgrades.speed = Math.min(3, player.upgrades.speed + speedBoost);
                break;
            case 'fireRate':
                const fireRateBoost = 0.5 * multiplier;
                player.upgrades.fireRate = Math.min(4, player.upgrades.fireRate + fireRateBoost);
                break;
            case 'damage':
                const damageBoost = 0.3 * multiplier;
                player.upgrades.damage = Math.min(3, player.upgrades.damage + damageBoost);
                break;
            case 'shield':
                // Temporary shield effect
                player.shield = Math.floor(50 * multiplier);
                break;
            case 'multi':
                // Legendary multi-upgrade
                player.upgradeWeapon();
                player.heal(100);
                player.upgradeShip('speed');
                player.upgradeShip('fireRate');
                player.upgradeShip('damage');
                break;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        // Draw glow effect based on tier
        if (this.glowIntensity > 0) {
            ctx.shadowColor = this.getColor();
            ctx.shadowBlur = 10 * this.glowIntensity;
        }
        
        const halfSize = this.size / 2;
        
        switch (this.type) {
            case 'weapon':
                this.drawWeaponPowerUp(ctx, halfSize);
                break;
            case 'health':
                this.drawHealthPowerUp(ctx, halfSize);
                break;
            case 'speed':
                this.drawSpeedPowerUp(ctx, halfSize);
                break;
            case 'fireRate':
                this.drawFireRatePowerUp(ctx, halfSize);
                break;
            case 'damage':
                this.drawDamagePowerUp(ctx, halfSize);
                break;
            case 'shield':
                this.drawShieldPowerUp(ctx, halfSize);
                break;
            case 'multi':
                this.drawMultiPowerUp(ctx, halfSize);
                break;
        }
        
        // Draw tier border
        this.drawTierBorder(ctx, halfSize);
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    getColor() {
        switch (this.type) {
            case 'weapon': return '#ffff00';
            case 'health': return '#ff00ff';
            case 'speed': return '#00ffff';
            case 'fireRate': return '#ff8800';
            case 'damage': return '#ff0000';
            case 'shield': return '#00ff00';
            case 'multi': return '#ff00ff';
            default: return '#ffffff';
        }
    }
    
    drawTierBorder(ctx, halfSize) {
        switch (this.tier) {
            case 'enhanced':
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 2;
                ctx.strokeRect(-halfSize - 2, -halfSize - 2, this.size + 4, this.size + 4);
                break;
            case 'legendary':
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.strokeRect(-halfSize - 3, -halfSize - 3, this.size + 6, this.size + 6);
                break;
        }
    }
    
    drawWeaponPowerUp(ctx, halfSize) {
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-halfSize/2, -halfSize/2, halfSize, halfSize);
        
        // Weapon symbol
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-2, -halfSize + 2, 4, halfSize - 4);
        ctx.fillRect(-halfSize + 2, -2, halfSize - 4, 4);
    }
    
    drawHealthPowerUp(ctx, halfSize) {
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        ctx.fillStyle = '#ff44ff';
        ctx.fillRect(-halfSize/2, -halfSize/2, halfSize, halfSize);
        
        // Cross symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -halfSize + 2, 4, this.size - 4);
        ctx.fillRect(-halfSize + 2, -2, this.size - 4, 4);
    }
    
    drawSpeedPowerUp(ctx, halfSize) {
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(-halfSize/2, -halfSize/2, halfSize, halfSize);
        
        // Speed lines
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(-halfSize + 2 + i * 4, -halfSize + 2, 2, this.size - 4);
        }
    }
    
    drawFireRatePowerUp(ctx, halfSize) {
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(-halfSize/2, -halfSize/2, halfSize, halfSize);
        
        // Fire symbol
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-halfSize + 2, -halfSize + 2, this.size - 4, 2);
        ctx.fillRect(-halfSize + 2, -halfSize + 4, 2, this.size - 8);
        ctx.fillRect(-halfSize + 4, halfSize - 6, this.size - 8, 2);
    }
    
    drawDamagePowerUp(ctx, halfSize) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(-halfSize/2, -halfSize/2, halfSize, halfSize);
        
        // Damage symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-halfSize + 2, -halfSize + 2, this.size - 4, 2);
        ctx.fillRect(-halfSize + 2, -halfSize + 4, 2, this.size - 8);
        ctx.fillRect(-halfSize + 4, halfSize - 6, this.size - 8, 2);
        ctx.fillRect(-halfSize + 6, -halfSize + 6, 2, this.size - 12);
    }
    
    drawShieldPowerUp(ctx, halfSize) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(-halfSize/2, -halfSize/2, halfSize, halfSize);
        
        // Shield symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-halfSize + 2, -halfSize + 2, this.size - 4, this.size - 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(-halfSize + 4, -halfSize + 4, this.size - 8, this.size - 8);
    }
    
    drawMultiPowerUp(ctx, halfSize) {
        // Rainbow effect for legendary multi-upgrade
        const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#00ffff', '#0088ff', '#8800ff'];
        const segmentSize = this.size / colors.length;
        
        for (let i = 0; i < colors.length; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillRect(-halfSize + i * segmentSize, -halfSize, segmentSize, this.size);
        }
        
        // Star symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -halfSize + 2, 4, this.size - 4);
        ctx.fillRect(-halfSize + 2, -2, this.size - 4, 4);
        ctx.fillRect(-halfSize/2, -halfSize/2, halfSize, halfSize);
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

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new Game();
});
