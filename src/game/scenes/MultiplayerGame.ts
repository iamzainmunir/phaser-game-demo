import { Scene } from 'phaser';
import { SpaceshipGraphics } from '../utils/SpaceshipGraphics';
import { SoundManager } from '../utils/SoundManager';
import { NetworkManager, Room, Player } from '../utils/NetworkManager';

interface GameData {
    room: Room;
    startTime: number;
}

export class MultiplayerGame extends Scene {
    private networkManager!: NetworkManager;
    private room!: Room;
    private currentPlayer!: Player;
    private isHost!: boolean;
    
    // Player objects
    private myPlayer!: Phaser.GameObjects.Container;
    private otherPlayers: Map<string, Phaser.GameObjects.Container> = new Map();
    
    // Game objects
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private bullets!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private stars!: Phaser.GameObjects.Group;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private playersAliveText!: Phaser.GameObjects.Text;
    private score: number = 0;
    private lives: number = 3;
    private lastShot: number = 0;
    private enemySpawnTimer!: Phaser.Time.TimerEvent;
    private timerUpdateTimer!: Phaser.Time.TimerEvent;
    private shootCooldown: number = 150;
    private enemySpawnRate: number = 1500;
    private backgroundGradient!: Phaser.GameObjects.Rectangle;
    private soundManager!: SoundManager;
    private engineTrails!: Phaser.GameObjects.Group;
    private lastTrailTime: number = 0;
    private lastMoveUpdate: number = 0;
    private timeRemaining: number = 300;
    private isDead: boolean = false;
    private deathMessage!: Phaser.GameObjects.Text;
    private leaveBtn!: Phaser.GameObjects.Rectangle;
    private confirmDialog!: Phaser.GameObjects.Container;

    constructor() {
        super('MultiplayerGame');
    }

    init(data: GameData) {
        this.room = data.room;
    }

    create() {
        // Get network manager from registry or create new
        const nm = this.registry.get('networkManager') as NetworkManager;
        if (nm) {
            this.networkManager = nm;
        } else {
            this.networkManager = new NetworkManager('http://localhost:3000');
            this.networkManager.connect();
        }
        
        this.currentPlayer = this.room.players.find(p => p.id === this.networkManager.getSocketId()) || this.room.players[0];
        this.isHost = this.networkManager.getIsHost();
        this.setupNetworkEvents();

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

        // Create my player ship
        const playerColor = this.currentPlayer.color;
        this.myPlayer = this.createPlayerShip(512, 650, playerColor);
        this.physics.add.existing(this.myPlayer);
        (this.myPlayer.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
        (this.myPlayer.body as Phaser.Physics.Arcade.Body).setSize(30, 30);

        // Create other players' ships
        this.room.players.forEach(player => {
            if (player.id !== this.networkManager.getSocketId()) {
                const otherShip = this.createPlayerShip(
                    Phaser.Math.Between(200, 800),
                    Phaser.Math.Between(400, 600),
                    player.color
                );
                this.otherPlayers.set(player.id, otherShip);
            }
        });

        // Create input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
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
        
        // Create leave button
        this.createLeaveButton();

        // Set up collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
        this.physics.add.overlap(this.myPlayer, this.enemies, this.hitPlayer, undefined, this);

        // Spawn enemies (host only)
        if (this.isHost) {
            this.enemySpawnTimer = this.time.addEvent({
                delay: this.enemySpawnRate,
                callback: this.spawnEnemy,
                callbackScope: this,
                loop: true
            });
            this.spawnEnemy();
            this.time.delayedCall(500, () => this.spawnEnemy(), [], this);
        }

        // Update timer
        this.timeRemaining = this.room.gameTime;
        this.timerUpdateTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (this.isHost) {
                    this.networkManager.requestTimer();
                }
            },
            callbackScope: this,
            loop: true
        });

        // Initial timer request
        this.networkManager.requestTimer();
    }

    createPlayerShip(x: number, y: number, color: number): Phaser.GameObjects.Container {
        const ship = this.add.container(x, y);
        
        // Main body
        const body = this.add.graphics();
        body.fillStyle(color, 1);
        body.fillTriangle(0, -25, -12, 8, 12, 8);
        body.lineStyle(2, 0xffffff, 1);
        body.strokeTriangle(0, -25, -12, 8, 12, 8);
        ship.add(body);
        
        // Cockpit
        const cockpit = this.add.graphics();
        cockpit.fillStyle(0x00d4ff, 0.8);
        cockpit.fillCircle(0, -5, 6);
        ship.add(cockpit);
        
        // Wings
        const wing1 = this.add.graphics();
        wing1.fillStyle(color - 0x200000, 1);
        wing1.fillRect(-15, 5, 8, 3);
        ship.add(wing1);
        
        const wing2 = this.add.graphics();
        wing2.fillStyle(color - 0x200000, 1);
        wing2.fillRect(7, 5, 8, 3);
        ship.add(wing2);
        
        // Engine glow
        const engineGlow = this.add.graphics();
        engineGlow.fillStyle(0x00ffff, 0.6);
        engineGlow.fillCircle(-6, 12, 4);
        engineGlow.fillCircle(6, 12, 4);
        ship.add(engineGlow);
        
        ship.setDepth(20);
        return ship;
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

        this.timerText = this.add.text(512, 20, 'Time: 5:00', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.timerText.setOrigin(0.5);
        this.timerText.setDepth(100);

        const aliveCount = this.room.players.filter(p => p.alive).length;
        this.playersAliveText = this.add.text(20, 60, `Players Alive: ${aliveCount}/${this.room.players.length}`, {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#00ff88',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.playersAliveText.setDepth(100);

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

    createLeaveButton() {
        // Leave button in top right
        this.leaveBtn = this.add.rectangle(944, 30, 120, 40, 0x666666, 0.8);
        this.leaveBtn.setStrokeStyle(2, 0xffffff);
        this.leaveBtn.setInteractive({ useHandCursor: true });
        this.leaveBtn.setDepth(100);

        const leaveText = this.add.text(944, 30, 'LEAVE', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        leaveText.setOrigin(0.5);
        leaveText.setDepth(101);

        this.leaveBtn.on('pointerover', () => {
            this.leaveBtn.setFillStyle(0x777777, 0.9);
        });
        this.leaveBtn.on('pointerout', () => {
            this.leaveBtn.setFillStyle(0x666666, 0.8);
        });
        this.leaveBtn.on('pointerdown', () => {
            this.showExitConfirmation();
        });
    }

    showExitConfirmation() {
        // Create overlay
        const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.7);
        overlay.setDepth(200);
        overlay.setInteractive();

        // Dialog container
        this.confirmDialog = this.add.container(512, 384);
        this.confirmDialog.setDepth(201);

        // Dialog background
        const bg = this.add.rectangle(0, 0, 400, 250, 0x1a1a3e, 0.95);
        bg.setStrokeStyle(3, 0xff6b6b);
        this.confirmDialog.add(bg);

        // Title
        const title = this.add.text(0, -80, 'Leave Game?', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 4
        });
        title.setOrigin(0.5);
        this.confirmDialog.add(title);

        // Message
        const message = this.add.text(0, -20, 'Are you sure you want to\nleave the game?', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        message.setOrigin(0.5);
        this.confirmDialog.add(message);

        // Warning for multiplayer
        const warning = this.add.text(0, 20, 'You will leave the room', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffa500',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        warning.setOrigin(0.5);
        this.confirmDialog.add(warning);

        // Yes button
        const yesBtn = this.add.rectangle(-80, 70, 120, 40, 0xff6b6b, 0.8);
        yesBtn.setStrokeStyle(2, 0xffffff);
        yesBtn.setInteractive({ useHandCursor: true });
        this.confirmDialog.add(yesBtn);

        const yesText = this.add.text(-80, 70, 'YES', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        yesText.setOrigin(0.5);
        this.confirmDialog.add(yesText);

        yesBtn.on('pointerover', () => yesBtn.setFillStyle(0xff7b7b, 0.9));
        yesBtn.on('pointerout', () => yesBtn.setFillStyle(0xff6b6b, 0.8));
        yesBtn.on('pointerdown', () => {
            this.exitGame();
        });

        // No button
        const noBtn = this.add.rectangle(80, 70, 120, 40, 0x4a9eff, 0.8);
        noBtn.setStrokeStyle(2, 0xffffff);
        noBtn.setInteractive({ useHandCursor: true });
        this.confirmDialog.add(noBtn);

        const noText = this.add.text(80, 70, 'NO', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        noText.setOrigin(0.5);
        this.confirmDialog.add(noText);

        noBtn.on('pointerover', () => noBtn.setFillStyle(0x5ab0ff, 0.9));
        noBtn.on('pointerout', () => noBtn.setFillStyle(0x4a9eff, 0.8));
        noBtn.on('pointerdown', () => {
            this.closeExitConfirmation();
        });

        // Close on overlay click
        overlay.on('pointerdown', () => {
            this.closeExitConfirmation();
        });
    }

    closeExitConfirmation() {
        if (this.confirmDialog) {
            this.confirmDialog.destroy();
            this.confirmDialog = null as any;
            // Remove overlay
            this.children.list.forEach((child: any) => {
                if (child.depth === 200 && child.fillColor === 0x000000) {
                    child.destroy();
                }
            });
        }
    }

    exitGame() {
        // Leave room if in multiplayer
        if (this.networkManager) {
            this.networkManager.leaveRoom();
        }
        
        // Pause physics
        this.physics.pause();
        
        // Fade out and return to menu
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenu');
        });
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

        // Skip player controls if dead
        if (this.isDead) {
            // Still update enemies and bullets for spectating
            this.updateGameObjects();
            return;
        }

        // Player movement
        const speed = 5;
        let moved = false;
        if (this.cursors && this.cursors.left.isDown) {
            this.myPlayer.x -= speed;
            moved = true;
        } else if (this.cursors && this.cursors.right.isDown) {
            this.myPlayer.x += speed;
            moved = true;
        }
        if (this.cursors && this.cursors.up.isDown) {
            this.myPlayer.y -= speed;
            moved = true;
        } else if (this.cursors && this.cursors.down.isDown) {
            this.myPlayer.y += speed;
            moved = true;
        }

        // Keep player in bounds
        this.myPlayer.x = Phaser.Math.Clamp(this.myPlayer.x, 15, 1009);
        this.myPlayer.y = Phaser.Math.Clamp(this.myPlayer.y, 15, 753);

        // Send movement update (throttled)
        if (moved && time > this.lastMoveUpdate + 50) {
            this.networkManager.sendPlayerMove(this.myPlayer.x, this.myPlayer.y);
            this.lastMoveUpdate = time;
        }

        // Shooting
        if (this.spaceKey && this.spaceKey.isDown && time > this.lastShot + this.shootCooldown) {
            this.shoot();
            this.lastShot = time;
        }

        // Update game objects
        this.updateGameObjects();

    }

    updateGameObjects() {
        // Update bullets
        this.bullets.children.entries.forEach((bullet: any) => {
            if (bullet && bullet.active) {
                bullet.y += bullet.speed || -8;
                const body = bullet.body as Phaser.Physics.Arcade.Body;
                if (body && body.enable) {
                    body.updateFromGameObject();
                }
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

        // Create engine trails (only if alive)
        if (!this.isDead && this.time.now > this.lastTrailTime + 50) {
            this.createEngineTrail(this.myPlayer.x, this.myPlayer.y + 12, 0x00ffff);
            this.lastTrailTime = this.time.now;
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
        this.soundManager.playShoot();
        
        // Create bullet with player's color
        const bulletColor = this.currentPlayer.color;
        const bullet = SpaceshipGraphics.createBullet(this, this.myPlayer.x, this.myPlayer.y - 25, bulletColor);
        
        this.physics.add.existing(bullet);
        const body = bullet.body as Phaser.Physics.Arcade.Body;
        body.setCircle(6);
        body.setCollideWorldBounds(false);
        
        (bullet as any).speed = -8;
        (bullet as any).playerId = this.networkManager.getSocketId();
        (bullet as any).playerColor = bulletColor;
        
        this.bullets.add(bullet);
        
        // Send to network
        this.networkManager.sendPlayerShoot({
            x: bullet.x,
            y: bullet.y,
            id: `bullet_${Date.now()}_${Math.random()}`,
            color: bulletColor
        });

        // Muzzle flash
        const flash = this.add.circle(this.myPlayer.x, this.myPlayer.y - 20, 12, 0xffffff, 0.9);
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
        if (!this.isHost) return;

        const x = Phaser.Math.Between(50, 974);
        const y = Phaser.Math.Between(-50, -100);
        const enemyType = Phaser.Math.Between(0, 2);
        
        let enemy: Phaser.GameObjects.Container;
        let speed: number;

        switch (enemyType) {
            case 0:
                enemy = SpaceshipGraphics.createSmallEnemy(this, x, y);
                speed = 3;
                break;
            case 1:
                enemy = SpaceshipGraphics.createMediumEnemy(this, x, y);
                speed = 2;
                break;
            default:
                enemy = SpaceshipGraphics.createLargeEnemy(this, x, y);
                speed = 1.5;
                break;
        }

        (enemy as any).speed = speed;
        (enemy as any).enemyType = enemyType;
        (enemy as any).enemyId = `enemy_${Date.now()}_${Math.random()}`;
        
        this.physics.add.existing(enemy);
        (enemy.body as Phaser.Physics.Arcade.Body).setSize(40, 40);
        this.enemies.add(enemy);

        // Send to network
        this.networkManager.sendEnemySpawn({
            x, y, enemyType, speed,
            enemyId: (enemy as any).enemyId
        });

        // Spawn effect
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
        this.soundManager.playExplosion();
        
        let explosionColor = 0xff6b6b;
        if (enemy.enemyType === 1) explosionColor = 0xffa500;
        else if (enemy.enemyType === 2) explosionColor = 0x9b59b6;
        
        this.createExplosion(enemy.x, enemy.y, explosionColor);
        
        let points = 10;
        if (enemy.speed === 1.5) points = 30;
        else if (enemy.speed === 2) points = 20;

        // Only update score if it's my bullet (not other players' bullets)
        if (bullet.playerId === this.networkManager.getSocketId() && !bullet.isOtherPlayer) {
            this.score += points;
            this.scoreText.setText(`Score: ${this.score}`);
            this.networkManager.sendEnemyHit(enemy.enemyId, points, { x: enemy.x, y: enemy.y });
        }

        bullet.destroy();
        enemy.destroy();
    }

    hitPlayer(_player: any, enemy: any) {
        if (this.isDead) return; // Already dead, ignore hits
        
        this.soundManager.playHit();
        this.createExplosion(enemy.x, enemy.y, 0xff0000);
        
        enemy.destroy();
        this.lives--;

        this.tweens.add({
            targets: this.myPlayer,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 4
        });
        
        this.cameras.main.shake(200, 0.01);

        if (this.lives <= 0) {
            this.isDead = true;
            this.networkManager.sendPlayerHit();
            this.showDeathScreen();
        }
    }

    showDeathScreen() {
        // Disable player controls
        this.cursors = null as any;
        this.spaceKey = null as any;
        
        // Hide player ship
        this.myPlayer.setAlpha(0.3);
        this.myPlayer.setActive(false);
        this.myPlayer.setVisible(false);
        
        // Create death message overlay
        const overlay = this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.5);
        overlay.setDepth(200);
        
        this.deathMessage = this.add.text(512, 300, 'YOU DIED!', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        });
        this.deathMessage.setOrigin(0.5);
        this.deathMessage.setDepth(201);
        
        const spectatorText = this.add.text(512, 400, 'Spectating... Waiting for game to end', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        });
        spectatorText.setOrigin(0.5);
        spectatorText.setDepth(201);
        
        // Animate death message
        this.tweens.add({
            targets: this.deathMessage,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 1
        });
        
        // Pulse spectator text
        this.tweens.add({
            targets: spectatorText,
            alpha: { from: 1, to: 0.5 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    createExplosion(x: number, y: number, color: number) {
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

    setupNetworkEvents() {
        this.networkManager.onPlayerMoved = (playerId, x, y) => {
            const otherShip = this.otherPlayers.get(playerId);
            if (otherShip) {
                otherShip.x = x;
                otherShip.y = y;
            }
        };

        this.networkManager.onPlayerShot = (playerId, bulletData) => {
            // Create bullet for other player (visual only, no collision)
            const otherShip = this.otherPlayers.get(playerId);
            if (otherShip) {
                // Get player's color from room data
                const player = this.room.players.find(p => p.id === playerId);
                const bulletColor = player?.color || bulletData.color || 0xffff00;
                
                const bullet = SpaceshipGraphics.createBullet(this, otherShip.x, otherShip.y - 25, bulletColor);
                bullet.setAlpha(0.8); // Slightly transparent for other players' bullets
                bullet.setDepth(50);
                (bullet as any).speed = -8;
                (bullet as any).isOtherPlayer = true; // Mark as other player's bullet
                this.bullets.add(bullet);
            }
        };

        this.networkManager.onEnemySpawned = (enemyData) => {
            if (this.isHost) return; // Host already spawned it
            
            let enemy: Phaser.GameObjects.Container;
            switch (enemyData.enemyType) {
                case 0:
                    enemy = SpaceshipGraphics.createSmallEnemy(this, enemyData.x, enemyData.y);
                    break;
                case 1:
                    enemy = SpaceshipGraphics.createMediumEnemy(this, enemyData.x, enemyData.y);
                    break;
                default:
                    enemy = SpaceshipGraphics.createLargeEnemy(this, enemyData.x, enemyData.y);
                    break;
            }

            (enemy as any).speed = enemyData.speed;
            (enemy as any).enemyType = enemyData.enemyType;
            (enemy as any).enemyId = enemyData.enemyId;
            
            this.physics.add.existing(enemy);
            (enemy.body as Phaser.Physics.Arcade.Body).setSize(40, 40);
            this.enemies.add(enemy);
        };

        this.networkManager.onEnemyDestroyed = (enemyId, position) => {
            // Find and destroy enemy
            this.enemies.children.entries.forEach((enemy: any) => {
                if (enemy && enemy.enemyId === enemyId) {
                    this.createExplosion(position.x, position.y, 0xff6b6b);
                    enemy.destroy();
                }
            });
        };

        this.networkManager.onScoreUpdate = (playerId, score) => {
            // Update other players' scores (we only show our own)
            const player = this.room.players.find(p => p.id === playerId);
            if (player) {
                player.score = score;
            }
        };

        this.networkManager.onPlayerDied = (playerId, room) => {
            this.room = room;
            const aliveCount = room.players.filter(p => p.alive).length;
            this.playersAliveText.setText(`Players Alive: ${aliveCount}/${room.players.length}`);
            
            // Hide dead player's ship
            const deadShip = this.otherPlayers.get(playerId);
            if (deadShip) {
                deadShip.setAlpha(0.3);
            }
            
            // If I died, show death screen (if not already shown)
            if (playerId === this.networkManager.getSocketId() && !this.isDead) {
                this.isDead = true;
                this.showDeathScreen();
            }
        };

        this.networkManager.onTimerUpdate = (timeRemaining) => {
            this.timeRemaining = timeRemaining;
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = Math.floor(timeRemaining % 60);
            this.timerText.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
            
            if (timeRemaining <= 10) {
                this.timerText.setColor('#ff0000');
            }
        };

        this.networkManager.onGameEnded = (room, rankings, reason) => {
            this.room = room;
            this.registry.set('finalRankings', rankings);
            this.registry.set('finalScore', this.score);
            this.registry.set('gameReason', reason);
            this.gameOver();
        };
    }

    gameOver() {
        if (this.enemySpawnTimer) this.enemySpawnTimer.destroy();
        if (this.timerUpdateTimer) this.timerUpdateTimer.destroy();
        this.physics.pause();
        
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MultiplayerGameOver');
        });
    }
}

