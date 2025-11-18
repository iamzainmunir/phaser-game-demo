import { Scene, GameObjects } from 'phaser';

export class MainMenu extends Scene
{
    background: GameObjects.Rectangle;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    startText: GameObjects.Text;
    stars: GameObjects.Group;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        // Create starfield
        this.createStarfield();
        
        // Create gradient background
        this.background = this.add.rectangle(512, 384, 1024, 768, 0x0a0a2e);

        // Logo with animation
        this.logo = this.add.image(512, 250, 'logo');
        this.logo.setScale(0.8);
        this.logo.setAlpha(0);
        
        this.tweens.add({
            targets: this.logo,
            alpha: 1,
            scale: 1,
            duration: 1000,
            ease: 'Back.easeOut'
        });

        // Title
        this.title = this.add.text(512, 380, 'SPACE SHOOTER', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#4a9eff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        this.title.setAlpha(0);
        
        this.tweens.add({
            targets: this.title,
            alpha: 1,
            y: 360,
            duration: 800,
            delay: 300
        });

        // Pulsing effect on title
        this.tweens.add({
            targets: this.title,
            scale: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Single Player button
        const singlePlayerBtn = this.add.rectangle(512, 480, 300, 60, 0x4a9eff, 0.8);
        singlePlayerBtn.setStrokeStyle(3, 0xffffff);
        singlePlayerBtn.setInteractive({ useHandCursor: true });
        
        const singlePlayerText = this.add.text(512, 480, 'SINGLE PLAYER', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        singlePlayerText.setAlpha(0);
        
        this.tweens.add({
            targets: singlePlayerText,
            alpha: 1,
            duration: 600,
            delay: 800
        });

        singlePlayerBtn.on('pointerover', () => {
            singlePlayerBtn.setFillStyle(0x5ab0ff, 0.9);
        });
        singlePlayerBtn.on('pointerout', () => {
            singlePlayerBtn.setFillStyle(0x4a9eff, 0.8);
        });
        singlePlayerBtn.on('pointerdown', () => {
            this.startSinglePlayer();
        });

        // Multiplayer button
        const multiplayerBtn = this.add.rectangle(512, 560, 300, 60, 0xff6b6b, 0.8);
        multiplayerBtn.setStrokeStyle(3, 0xffffff);
        multiplayerBtn.setInteractive({ useHandCursor: true });
        
        const multiplayerText = this.add.text(512, 560, 'MULTIPLAYER', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        multiplayerText.setAlpha(0);
        
        this.tweens.add({
            targets: multiplayerText,
            alpha: 1,
            duration: 600,
            delay: 900
        });

        multiplayerBtn.on('pointerover', () => {
            multiplayerBtn.setFillStyle(0xff7b7b, 0.9);
        });
        multiplayerBtn.on('pointerout', () => {
            multiplayerBtn.setFillStyle(0xff6b6b, 0.8);
        });
        multiplayerBtn.on('pointerdown', () => {
            this.startMultiplayer();
        });

        // Instructions
        const instructions = this.add.text(512, 650, 'Arrow Keys: Move | Space: Shoot', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#aaaaaa',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5);
        instructions.setAlpha(0.7);
    }

    createStarfield() {
        this.stars = this.add.group();
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(0, 1024);
            const y = Phaser.Math.Between(0, 768);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const star = this.add.circle(x, y, size, 0xffffff, 0.8);
            this.stars.add(star);
        }
    }

    update() {
        // Animate stars
        this.stars.children.entries.forEach((star: any) => {
            star.y += 0.5;
            if (star.y > 768) {
                star.y = 0;
                star.x = Phaser.Math.Between(0, 1024);
            }
        });
    }

    startSinglePlayer() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game');
        });
    }

    startMultiplayer() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Lobby');
        });
    }
}
