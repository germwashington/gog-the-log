// Tyrian Reborn - Game Engine
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'start'; // start, playing, paused, gameOver
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
        
        // Game settings
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 2000; // milliseconds
        this.scrollSpeed = 50;
        this.backgroundOffset = 0;
        
        // Audio system
        this.audioEnabled = true;
        this.sounds = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createStarField();
        this.createAudioContext();
        this.player = new Player(this.width / 2, this.height - 100);
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
            this.keys[e.code] = true;
            
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
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2
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
        this.player = new Player(this.width / 2, this.height - 100);
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
        
        // Update background
        this.backgroundOffset += this.scrollSpeed * deltaTime / 1000;
        if (this.backgroundOffset > this.height) {
            this.backgroundOffset = 0;
        }
        
        // Update stars
        this.stars.forEach(star => {
            star.y += star.speed * deltaTime / 16;
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
        const types = ['basic', 'fast', 'heavy'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (this.width - 60) + 30;
        this.enemies.push(new Enemy(x, -50, type));
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
        
        // Enemies vs player
        this.enemies.forEach(enemy => {
            if (this.isColliding(enemy, this.player)) {
                this.player.takeDamage(20);
                enemy.takeDamage(50);
                this.createExplosion(enemy.x, enemy.y, '#ffff44');
                this.updateUI();
            }
        });
        
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
        // Clear canvas with optimized clearing
        this.ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Enable image smoothing for better performance
        this.ctx.imageSmoothingEnabled = false;
        
        // Draw stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.brightness;
            this.ctx.fillRect(star.x, star.y, 1, 1);
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
        
        this.update(this.deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 300;
        this.health = 100;
        this.maxHealth = 100;
        this.weaponType = 'Pulse Cannon';
        this.fireRate = 200; // milliseconds
        this.lastShot = 0;
        this.weaponLevel = 1;
    }
    
    update(deltaTime, keys) {
        // Movement
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.x -= this.speed * deltaTime / 1000;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.x += this.speed * deltaTime / 1000;
        }
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.y -= this.speed * deltaTime / 1000;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            this.y += this.speed * deltaTime / 1000;
        }
        
        // Keep player in bounds
        this.x = Math.max(0, Math.min(this.x, game.width - this.width));
        this.y = Math.max(0, Math.min(this.y, game.height - this.height));
        
        // Shooting
        if (keys['Space'] || keys['KeyZ']) {
            this.shoot();
        }
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.fireRate) {
            // Create bullet(s) based on weapon level
            if (this.weaponLevel === 1) {
                game.bullets.push(new Bullet(this.x + this.width/2, this.y, 'player'));
            } else if (this.weaponLevel === 2) {
                game.bullets.push(new Bullet(this.x + this.width/2 - 10, this.y, 'player'));
                game.bullets.push(new Bullet(this.x + this.width/2 + 10, this.y, 'player'));
            } else {
                game.bullets.push(new Bullet(this.x + this.width/2, this.y, 'player'));
                game.bullets.push(new Bullet(this.x + this.width/2 - 15, this.y + 10, 'player'));
                game.bullets.push(new Bullet(this.x + this.width/2 + 15, this.y + 10, 'player'));
            }
            game.playSound('shoot');
            this.lastShot = now;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    upgradeWeapon() {
        if (this.weaponLevel < 3) {
            this.weaponLevel++;
            this.weaponType = ['Pulse Cannon', 'Twin Blaster', 'Spread Shot'][this.weaponLevel - 1];
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    render(ctx) {
        // Draw ship body
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x + 10, this.y + 10, 20, 30);
        
        // Draw ship wings
        ctx.fillStyle = '#00cc00';
        ctx.fillRect(this.x, this.y + 20, 10, 15);
        ctx.fillRect(this.x + 30, this.y + 20, 10, 15);
        
        // Draw ship cockpit
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(this.x + 15, this.y + 5, 10, 10);
        
        // Draw engine glow
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(this.x + 12, this.y + 35, 6, 8);
        ctx.fillRect(this.x + 22, this.y + 35, 6, 8);
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = 100;
        this.health = 30;
        this.maxHealth = 30;
        this.points = 100;
        this.fireRate = 1000;
        this.lastShot = 0;
        this.movePattern = 0;
        this.moveTimer = 0;
        
        // Configure based on type
        switch (type) {
            case 'fast':
                this.speed = 200;
                this.health = 15;
                this.maxHealth = 15;
                this.points = 150;
                this.width = 25;
                this.height = 25;
                break;
            case 'heavy':
                this.speed = 50;
                this.health = 80;
                this.maxHealth = 80;
                this.points = 300;
                this.fireRate = 800;
                this.width = 50;
                this.height = 50;
                break;
            default: // basic
                this.width = 30;
                this.height = 30;
        }
    }
    
    update(deltaTime) {
        this.moveTimer += deltaTime;
        
        // Movement patterns
        switch (this.type) {
            case 'fast':
                this.y += this.speed * deltaTime / 1000;
                this.x += Math.sin(this.moveTimer / 200) * 2;
                break;
            case 'heavy':
                this.y += this.speed * deltaTime / 1000;
                break;
            default: // basic
                this.y += this.speed * deltaTime / 1000;
                this.x += Math.sin(this.moveTimer / 500) * 1;
        }
        
        // Keep in bounds horizontally
        this.x = Math.max(0, Math.min(this.x, game.width - this.width));
        
        // Shooting
        if (Math.random() < 0.001 && this.y > 50) {
            this.shoot();
        }
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot > this.fireRate) {
            game.bullets.push(new Bullet(this.x + this.width/2, this.y + this.height, 'enemy'));
            this.lastShot = now;
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }
    
    render(ctx) {
        // Draw based on type
        switch (this.type) {
            case 'fast':
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(this.x + 5, this.y, 15, 25);
                ctx.fillStyle = '#ff8888';
                ctx.fillRect(this.x, this.y + 10, 25, 10);
                break;
            case 'heavy':
                ctx.fillStyle = '#8844ff';
                ctx.fillRect(this.x + 10, this.y, 30, 40);
                ctx.fillStyle = '#aa88ff';
                ctx.fillRect(this.x, this.y + 15, 50, 20);
                ctx.fillStyle = '#4422aa';
                ctx.fillRect(this.x + 20, this.y + 5, 10, 10);
                break;
            default: // basic
                ctx.fillStyle = '#ff8800';
                ctx.fillRect(this.x + 5, this.y, 20, 30);
                ctx.fillStyle = '#ffaa44';
                ctx.fillRect(this.x, this.y + 10, 30, 15);
        }
        
        // Health bar for damaged enemies
        if (this.health < this.maxHealth) {
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x, this.y - 8, this.width, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y - 8, this.width * healthPercent, 4);
        }
    }
}

// Bullet class
class Bullet {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.width = 4;
        this.height = 8;
        this.damage = 25;
        
        if (owner === 'player') {
            this.speed = -500; // Negative for upward movement
            this.color = '#00ffff';
        } else {
            this.speed = 300;
            this.color = '#ff4444';
        }
    }
    
    update(deltaTime) {
        this.y += this.speed * deltaTime / 1000;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// PowerUp class
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 100;
        this.type = Math.random() < 0.5 ? 'weapon' : 'health';
        this.rotation = 0;
    }
    
    update(deltaTime) {
        this.y += this.speed * deltaTime / 1000;
        this.rotation += deltaTime / 100;
    }
    
    apply(player) {
        if (this.type === 'weapon') {
            player.upgradeWeapon();
        } else {
            player.heal(30);
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        if (this.type === 'weapon') {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(-8, -8, 16, 16);
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(-4, -4, 8, 8);
        } else {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(-8, -2, 16, 4);
            ctx.fillRect(-2, -8, 4, 16);
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

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new Game();
});
