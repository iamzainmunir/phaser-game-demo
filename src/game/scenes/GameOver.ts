import { Scene } from 'phaser';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Rectangle;
    gameover_text: Phaser.GameObjects.Text;
    scoreText: Phaser.GameObjects.Text;
    instructionText: Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x1a1a3e);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Create gradient background
        this.background = this.add.rectangle(512, 384, 1024, 768, 0x1a1a3e);
        
        // Get final score from registry
        const finalScore = this.registry.get('finalScore') || 0;

        // Game Over title with animation
        this.gameover_text = this.add.text(512, 250, 'GAME OVER', {
            fontFamily: 'Arial Black',
            fontSize: 72,
            color: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        });
        this.gameover_text.setOrigin(0.5);
        this.gameover_text.setAlpha(0);
        
        // Animate title
        this.tweens.add({
            targets: this.gameover_text,
            alpha: 1,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 1
        });

        // Score display
        this.scoreText = this.add.text(512, 380, `Final Score: ${finalScore}`, {
            fontFamily: 'Arial',
            fontSize: 36,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        });
        this.scoreText.setOrigin(0.5);
        this.scoreText.setAlpha(0);
        
        this.tweens.add({
            targets: this.scoreText,
            alpha: 1,
            y: 360,
            duration: 600,
            delay: 300
        });

        // Performance message
        let message = '';
        if (finalScore >= 500) {
            message = '🌟 OUTSTANDING! 🌟';
        } else if (finalScore >= 300) {
            message = '🎯 EXCELLENT! 🎯';
        } else if (finalScore >= 150) {
            message = '⭐ GREAT JOB! ⭐';
        } else if (finalScore >= 50) {
            message = '👍 GOOD EFFORT! 👍';
        } else {
            message = '💪 KEEP TRYING! 💪';
        }

        const messageText = this.add.text(512, 450, message, {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#4a9eff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        messageText.setOrigin(0.5);
        messageText.setAlpha(0);
        
        this.tweens.add({
            targets: messageText,
            alpha: 1,
            duration: 600,
            delay: 600
        });

        // Instruction text
        this.instructionText = this.add.text(512, 600, 'Click or Press Any Key to Return to Menu', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        this.instructionText.setOrigin(0.5);
        this.instructionText.setAlpha(0.7);
        
        // Blinking effect
        this.tweens.add({
            targets: this.instructionText,
            alpha: { from: 0.7, to: 0.3 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Create some particles for effect
        this.createParticles();

        // Input handlers
        this.input.once('pointerdown', () => {
            this.returnToMenu();
        });

        this.input.keyboard!.once('keydown', () => {
            this.returnToMenu();
        });
    }

    createParticles() {
        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(0, 1024);
            const y = Phaser.Math.Between(0, 768);
            const particle = this.add.circle(x, y, 2, 0xffffff, 0.5);
            
            this.tweens.add({
                targets: particle,
                y: y - Phaser.Math.Between(100, 300),
                alpha: 0,
                duration: Phaser.Math.Between(2000, 4000),
                repeat: -1,
                delay: i * 100
            });
        }
    }

    returnToMenu() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenu');
        });
    }
}
