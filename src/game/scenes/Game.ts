import { Scene } from 'phaser';
import { SpaceshipGraphics } from '../utils/SpaceshipGraphics';
import { SoundManager } from '../utils/SoundManager';

export class Game extends Scene
{
    private player!: Phaser.GameObjects.Container;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private bullets!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private stars!: Phaser.GameObjects.Group;
    private scoreText!: Phaser.GameObjects.Text;
    private livesText!: Phaser.GameObjects.Text;
    private score: number = 0;
    private lives: number = 3;
    private lastShot: number = 0;
    private enemySpawnTimer!: Phaser.Time.TimerEvent;
    private shootCooldown: number = 150; // milliseconds
    private enemySpawnRate: number = 1500; // milliseconds
    private backgroundGradient!: Phaser.GameObjects.Rectangle;
    private soundManager!: SoundManager;
    private engineTrails!: Phaser.GameObjects.Group;
    private lastTrailTime: number = 0;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        // Initialize sound manager
        this.soundManager = new SoundManager(this);
        
        // Create starfield background
        this.createStarfield();
        
        // Create gradient background
        this.backgroundGradient = this.add.rectangle(512, 384, 1024, 768, 0x0a0a2e);
        this.backgroundGradient.setDepth(0);

        // Create physics groups
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.engineTrails = this.add.group();

        // Create detailed player spaceship
        this.player = SpaceshipGraphics.createPlayerShip(this, 512, 650);
        this.physics.add.existing(this.player);
        (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
        (this.player.body as Phaser.Physics.Arcade.Body).setSize(30, 30);

        // Create input - Phaser automatically provides keyboard access
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Also listen for keydown events as backup for better responsiveness
        this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
            if (event.code === 'Space' || event.key === ' ') {
                const currentTime = this.time.now;
                if (currentTime > this.lastShot + this.shootCooldown) {
                    this.shoot();
                    this.lastShot = currentTime;
                }
            }
        });

        // Create UI
        this.createUI();

        // Create particle effects
        this.createParticles();

        // Set up collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, undefined, this);

        // Spawn enemies periodically
        this.enemySpawnTimer = this.time.addEvent({
            delay: this.enemySpawnRate,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Start spawning enemies immediately
        this.spawnEnemy();
        this.time.delayedCall(500, () => this.spawnEnemy(), [], this);
    }

    createStarfield() {
        this.stars = this.add.group();
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, 1024);
            const y = Phaser.Math.Between(0, 768);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const star = this.add.circle(x, y, size, 0xffffff, 0.8);
            star.setDepth(1);
            this.stars.add(star);
        }
    }

    createUI() {
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.scoreText.setDepth(100);

        this.livesText = this.add.text(20, 60, 'Lives: 3', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.livesText.setDepth(100);

        // Instructions
        const instructions = this.add.text(512, 700, 'Arrow Keys: Move | Space: Shoot', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        });
        instructions.setOrigin(0.5);
        instructions.setDepth(100);
        instructions.setAlpha(0.7);
    }

    createParticles() {
        // Create particle emitter for explosions
        if (!this.add.particles) return;
    }

    update(time: number) {
        // Move stars
        this.stars.children.entries.forEach((star: any) => {
            star.y += 1;
            if (star.y > 768) {
                star.y = 0;
                star.x = Phaser.Math.Between(0, 1024);
            }
        });

        // Player movement
        const speed = 5;
        if (this.cursors.left.isDown) {
            this.player.x -= speed;
        } else if (this.cursors.right.isDown) {
            this.player.x += speed;
        }
        if (this.cursors.up.isDown) {
            this.player.y -= speed;
        } else if (this.cursors.down.isDown) {
            this.player.y += speed;
        }

        // Keep player in bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 15, 1009);
        this.player.y = Phaser.Math.Clamp(this.player.y, 15, 753);

        // Shooting - check if space key is held down
        if (this.spaceKey && this.spaceKey.isDown && time > this.lastShot + this.shootCooldown) {
            this.shoot();
            this.lastShot = time;
        }

        // Update bullets - manual movement for consistency
        this.bullets.children.entries.forEach((bullet: any) => {
            if (bullet && bullet.active) {
                // Move bullet upward manually
                bullet.y += bullet.speed || -8;
                
                // Update physics body position to match visual position for collision detection
                const body = bullet.body as Phaser.Physics.Arcade.Body;
                if (body && body.enable) {
                    body.updateFromGameObject();
                }
                
                // Clean up bullets that are off screen
                if (bullet.y < -10) {
                    bullet.destroy();
                }
            }
        });

        // Update enemies
        this.enemies.children.entries.forEach((enemy: any) => {
            if (enemy && enemy.active) {
                enemy.y += enemy.speed || 2;
                if (enemy.y > 800) {
                    enemy.destroy();
                }
            }
        });

        // Create engine trails for player
        if (time > this.lastTrailTime + 50) {
            this.createEngineTrail(this.player.x, this.player.y + 12, 0x00ffff);
            this.lastTrailTime = time;
        }

        // Update engine trails
        this.engineTrails.children.entries.forEach((trail: any) => {
            if (trail && trail.active) {
                trail.alpha -= 0.05;
                trail.scaleX *= 0.95;
                trail.scaleY *= 0.95;
                if (trail.alpha <= 0) {
                    trail.destroy();
                }
            }
        });
    }

    shoot() {
        // Play shoot sound
        this.soundManager.playShoot();
        
        // Create enhanced bullet visual
        const bullet = this.add.circle(this.player.x, this.player.y - 25, 6, 0xffff00, 1);
        bullet.setStrokeStyle(2, 0xffffff);
        bullet.setDepth(50);
        
        // Add glow effect
        const glow = this.add.circle(this.player.x, this.player.y - 25, 8, 0xffff00, 0.3);
        glow.setDepth(49);
        this.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => glow.destroy()
        });
        
        // Add physics body for collision detection
        this.physics.add.existing(bullet);
        const body = bullet.body as Phaser.Physics.Arcade.Body;
        body.setCircle(6);
        body.setCollideWorldBounds(false);
        
        // Store speed for manual movement
        (bullet as any).speed = -8;
        (bullet as any).glow = glow;
        
        // Add to bullets group
        this.bullets.add(bullet);

        // Enhanced muzzle flash
        const flash = this.add.circle(this.player.x, this.player.y - 20, 12, 0xffffff, 0.9);
        flash.setDepth(50);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2.5,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(50, 974);
        const y = Phaser.Math.Between(-50, -100);
        
        // Create different enemy types with detailed spaceships
        const enemyType = Phaser.Math.Between(0, 2);
        let enemy: Phaser.GameObjects.Container;
        let speed: number;

        switch (enemyType) {
            case 0: // Small fast enemy
                enemy = SpaceshipGraphics.createSmallEnemy(this, 0, 0);
                speed = 3;
                break;
            case 1: // Medium enemy
                enemy = SpaceshipGraphics.createMediumEnemy(this, 0, 0);
                speed = 2;
                break;
            default: // Large slow enemy
                enemy = SpaceshipGraphics.createLargeEnemy(this, 0, 0);
                speed = 1.5;
                break;
        }

        enemy.setPosition(x, y);
        (enemy as any).speed = speed;
        (enemy as any).enemyType = enemyType;
        this.physics.add.existing(enemy);
        (enemy.body as Phaser.Physics.Arcade.Body).setSize(40, 40);
        this.enemies.add(enemy);

        // Enhanced spawn effect
        const spawnEffect = this.add.circle(x, y, 25, 0x00ffff, 0.6);
        spawnEffect.setDepth(15);
        this.tweens.add({
            targets: spawnEffect,
            alpha: 0,
            scale: 4,
            duration: 400,
            onComplete: () => spawnEffect.destroy()
        });
    }

    hitEnemy(bullet: any, enemy: any) {
        // Play explosion sound
        this.soundManager.playExplosion();
        
        // Determine explosion color based on enemy type
        let explosionColor = 0xff6b6b;
        if (enemy.enemyType === 1) explosionColor = 0xffa500;
        else if (enemy.enemyType === 2) explosionColor = 0x9b59b6;
        
        // Create enhanced explosion effect
        this.createExplosion(enemy.x, enemy.y, explosionColor);
        
        // Destroy bullet and enemy
        if (bullet.glow) bullet.glow.destroy();
        bullet.destroy();
        enemy.destroy();

        // Update score based on enemy type
        let points = 10;
        if (enemy.speed === 1.5) points = 30;
        else if (enemy.speed === 2) points = 20;
        
        this.score += points;
        this.scoreText.setText(`Score: ${this.score}`);

        // Show score popup
        const scorePopup = this.add.text(enemy.x, enemy.y, `+${points}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        scorePopup.setOrigin(0.5);
        scorePopup.setDepth(100);
        this.tweens.add({
            targets: scorePopup,
            y: enemy.y - 50,
            alpha: 0,
            scale: 1.5,
            duration: 600,
            onComplete: () => scorePopup.destroy()
        });

        // Increase difficulty
        if (this.score % 100 === 0 && this.enemySpawnRate > 800) {
            this.enemySpawnRate -= 50;
            this.enemySpawnTimer.destroy();
            this.enemySpawnTimer = this.time.addEvent({
                delay: this.enemySpawnRate,
                callback: this.spawnEnemy,
                callbackScope: this,
                loop: true
            });
        }
    }

    hitPlayer(_player: any, enemy: any) {
        // Play hit sound
        this.soundManager.playHit();
        
        // Create explosion
        this.createExplosion(enemy.x, enemy.y, 0xff0000);
        
        enemy.destroy();
        this.lives--;

        // Flash player with shake effect
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4
        });
        
        // Camera shake
        this.cameras.main.shake(200, 0.01);

        this.livesText.setText(`Lives: ${this.lives}`);

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    createExplosion(x: number, y: number, color: number) {
        // Create multiple particles with varying sizes
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = Phaser.Math.Between(20, 50);
            const size = Phaser.Math.Between(2, 5);
            const particle = this.add.circle(x, y, size, color, 1);
            particle.setDepth(20);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(300, 500),
                onComplete: () => particle.destroy()
            });
        }

        // Multiple flash rings
        for (let i = 0; i < 3; i++) {
            const flash = this.add.circle(x, y, 30 + (i * 10), color, 0.7 - (i * 0.2));
            flash.setDepth(20);
            this.tweens.add({
                targets: flash,
                alpha: 0,
                scale: 2 + (i * 0.5),
                duration: 200 + (i * 50),
                delay: i * 50,
                onComplete: () => flash.destroy()
            });
        }

        // Shockwave effect
        const shockwave = this.add.circle(x, y, 10, 0xffffff, 0.5);
        shockwave.setStrokeStyle(2, color);
        shockwave.setDepth(19);
        this.tweens.add({
            targets: shockwave,
            scale: 5,
            alpha: 0,
            duration: 300,
            onComplete: () => shockwave.destroy()
        });
    }

    createEngineTrail(x: number, y: number, color: number = 0x00ffff) {
        const trail = this.add.circle(x, y, 4, color, 0.6);
        trail.setDepth(5);
        this.engineTrails.add(trail);
    }

    gameOver() {
        // Stop spawning
        this.enemySpawnTimer.destroy();
        
        // Stop all movement
        this.physics.pause();
        
        // Store score for GameOver scene
        this.registry.set('finalScore', this.score);
        
        // Fade out
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameOver');
        });
    }
}
