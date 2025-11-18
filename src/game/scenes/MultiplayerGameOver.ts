import { Scene } from 'phaser';
import { Player } from '../utils/NetworkManager';

export class MultiplayerGameOver extends Scene {
    private rankings!: Player[];
    private myScore!: number;
    private gameReason!: string;

    constructor() {
        super('MultiplayerGameOver');
    }

    create() {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x1a1a3e);
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // Get data from registry
        this.rankings = this.registry.get('finalRankings') || [];
        this.myScore = this.registry.get('finalScore') || 0;
        this.gameReason = this.registry.get('gameReason') || 'time_up';

        // Background
        const background = this.add.rectangle(512, 384, 1024, 768, 0x1a1a3e);

        // Title
        const title = this.add.text(512, 100, 'GAME OVER', {
            fontFamily: 'Arial Black',
            fontSize: 72,
            color: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        });
        title.setOrigin(0.5);
        title.setAlpha(0);
        
        this.tweens.add({
            targets: title,
            alpha: 1,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 1
        });

        // Game end reason
        const reasonText = this.add.text(512, 180, 
            this.gameReason === 'all_dead' ? 'All Players Eliminated!' : 'Time\'s Up!',
            {
                fontFamily: 'Arial',
                fontSize: 32,
                color: '#4a9eff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        );
        reasonText.setOrigin(0.5);
        reasonText.setAlpha(0);
        
        this.tweens.add({
            targets: reasonText,
            alpha: 1,
            duration: 600,
            delay: 300
        });

        // Rankings panel
        const panelBg = this.add.rectangle(512, 400, 700, 400, 0x0a0a2e, 0.9);
        panelBg.setStrokeStyle(3, 0x4a9eff);

        const rankingsTitle = this.add.text(512, 250, 'FINAL RANKINGS', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#4a9eff',
            stroke: '#000000',
            strokeThickness: 4
        });
        rankingsTitle.setOrigin(0.5);

        // Display rankings
        this.rankings.forEach((player, index) => {
            const yPos = 320 + (index * 60);
            const isMe = player.score === this.myScore;
            
            // Rank background
            const rankBg = this.add.rectangle(512, yPos, 650, 50, 
                isMe ? 0x2a4a6e : 0x1a1a3e, 0.8);
            rankBg.setStrokeStyle(2, isMe ? 0xffff00 : 0x4a9eff);
            
            // Rank number
            const rankText = this.add.text(100, yPos, `#${index + 1}`, {
                fontFamily: 'Arial Black',
                fontSize: 24,
                color: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            });
            rankText.setOrigin(0, 0.5);

            // Player color indicator
            const colorCircle = this.add.circle(200, yPos, 12, player.color, 1);
            colorCircle.setStrokeStyle(2, 0xffffff);

            // Player name
            const nameText = this.add.text(230, yPos, player.name, {
                fontFamily: 'Arial',
                fontSize: 22,
                color: isMe ? '#ffff00' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            });
            nameText.setOrigin(0, 0.5);

            // Score
            const scoreText = this.add.text(600, yPos, `${player.score}`, {
                fontFamily: 'Arial Black',
                fontSize: 24,
                color: '#00ff88',
                stroke: '#000000',
                strokeThickness: 2
            });
            scoreText.setOrigin(1, 0.5);

            // "YOU" indicator
            if (isMe) {
                const youText = this.add.text(650, yPos, 'YOU', {
                    fontFamily: 'Arial Black',
                    fontSize: 18,
                    color: '#ffff00',
                    stroke: '#000000',
                    strokeThickness: 2
                });
                youText.setOrigin(0, 0.5);
            }

            // Trophy for top 3
            if (index < 3) {
                const trophy = this.add.text(50, yPos, index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉', {
                    fontSize: 30
                });
                trophy.setOrigin(0.5);
            }
        });

        // Continue button (center)
        const continueBtn = this.add.rectangle(512, 650, 250, 60, 0x4a9eff, 0.8);
        continueBtn.setStrokeStyle(3, 0xffffff);
        continueBtn.setInteractive({ useHandCursor: true });

        const continueText = this.add.text(512, 650, 'RETURN TO MENU', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        continueText.setOrigin(0.5);

        continueBtn.on('pointerover', () => continueBtn.setFillStyle(0x5ab0ff, 0.9));
        continueBtn.on('pointerout', () => continueBtn.setFillStyle(0x4a9eff, 0.8));
        continueBtn.on('pointerdown', () => {
            this.returnToMenu();
        });

        // Back button (top-left with proper spacing)
        const backBtnContainer = this.add.container(100, 50);
        backBtnContainer.setDepth(200);
        
        const backBtn = this.add.rectangle(0, 0, 150, 50, 0x666666, 0.9);
        backBtn.setStrokeStyle(2, 0xffffff);
        backBtn.setInteractive({ useHandCursor: true });
        backBtnContainer.add(backBtn);

        const backArrow = this.add.text(-40, 0, '←', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        backBtnContainer.add(backArrow);

        const backText = this.add.text(30, 0, 'BACK', {
            fontFamily: 'Arial Black',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        backBtnContainer.add(backText);

        backBtn.on('pointerover', () => {
            backBtn.setFillStyle(0x777777, 1);
            backBtnContainer.setScale(1.05);
        });
        backBtn.on('pointerout', () => {
            backBtn.setFillStyle(0x666666, 0.9);
            backBtnContainer.setScale(1);
        });
        backBtn.on('pointerdown', () => {
            this.returnToMenu();
        });

        // Particles
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < 30; i++) {
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

