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

        // Start instruction
        this.startText = this.add.text(512, 550, 'Click or Press Any Key to Start', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        this.startText.setAlpha(0);
        
        this.tweens.add({
            targets: this.startText,
            alpha: 1,
            duration: 600,
            delay: 800
        });

        // Blinking effect
        this.tweens.add({
            targets: this.startText,
            alpha: { from: 1, to: 0.5 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            delay: 1400
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

        // Input handlers
        this.input.once('pointerdown', () => {
            this.startGame();
        });

        this.input.keyboard!.once('keydown', () => {
            this.startGame();
        });
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

    startGame() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game');
        });
    }
}
