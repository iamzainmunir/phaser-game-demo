import { Scene, GameObjects } from 'phaser';
import { NetworkManager, Room, Player } from '../utils/NetworkManager';

export class Lobby extends Scene {
    private networkManager!: NetworkManager;
    private currentRoom: Room | null = null;
    private currentPlayer: Player | null = null;
    private isHost: boolean = false;
    
    // UI Elements
    private background!: GameObjects.Rectangle;
    private stars!: GameObjects.Group;
    private createRoomPanel!: GameObjects.Container;
    private joinRoomPanel!: GameObjects.Container;
    private lobbyPanel!: GameObjects.Container;
    private playerNameInput!: HTMLInputElement;
    private roomCodeInput!: HTMLInputElement;
    private gameTimeInput!: HTMLInputElement;
    private maxPlayersInput!: HTMLInputElement;
    private errorText!: GameObjects.Text;
    private roomCodeText!: GameObjects.Text;
    private playersList!: GameObjects.Container;
    private readyBtn!: GameObjects.Rectangle;
    private startBtn!: GameObjects.Rectangle;
    private backBtn!: GameObjects.Rectangle;

    constructor() {
        super('Lobby');
    }

    create() {
        // Create starfield
        this.createStarfield();
        
        // Create background
        this.background = this.add.rectangle(512, 384, 1024, 768, 0x0a0a2e);
        this.background.setDepth(0);
        
        // Initialize network manager
        this.networkManager = new NetworkManager('http://localhost:3000');
        this.setupNetworkEvents();
        
        try {
            this.networkManager.connect();
        } catch (error) {
            console.error('Failed to connect to server:', error);
            // Show error but continue - user can still try to connect
        }

        // Show initial menu (Create or Join)
        this.showMainMenu();
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

    showMainMenu() {
        // Title
        const title = this.add.text(512, 150, 'MULTIPLAYER LOBBY', {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#4a9eff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Create Room button
        const createBtn = this.add.rectangle(512, 350, 300, 70, 0x4a9eff, 0.8);
        createBtn.setStrokeStyle(3, 0xffffff);
        createBtn.setInteractive({ useHandCursor: true });
        
        const createText = this.add.text(512, 350, 'CREATE ROOM', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        createBtn.on('pointerover', () => createBtn.setFillStyle(0x5ab0ff, 0.9));
        createBtn.on('pointerout', () => createBtn.setFillStyle(0x4a9eff, 0.8));
        createBtn.on('pointerdown', () => {
            title.destroy();
            createBtn.destroy();
            createText.destroy();
            joinBtn.destroy();
            joinText.destroy();
            backBtn.destroy();
            backText.destroy();
            this.showCreateRoomPanel();
        });

        // Join Room button
        const joinBtn = this.add.rectangle(512, 450, 300, 70, 0xff6b6b, 0.8);
        joinBtn.setStrokeStyle(3, 0xffffff);
        joinBtn.setInteractive({ useHandCursor: true });
        
        const joinText = this.add.text(512, 450, 'JOIN ROOM', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        joinBtn.on('pointerover', () => joinBtn.setFillStyle(0xff7b7b, 0.9));
        joinBtn.on('pointerout', () => joinBtn.setFillStyle(0xff6b6b, 0.8));
        joinBtn.on('pointerdown', () => {
            title.destroy();
            createBtn.destroy();
            createText.destroy();
            joinBtn.destroy();
            joinText.destroy();
            backBtn.destroy();
            backText.destroy();
            this.showJoinRoomPanel();
        });

        // Back button (top-left with proper spacing)
        const backBtnContainer = this.add.container(100, 50);
        
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
            this.networkManager.disconnect();
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MainMenu');
            });
        });
    }

    showCreateRoomPanel() {
        // Remove any existing panels first
        if (this.createRoomPanel) this.createRoomPanel.destroy();
        if (this.joinRoomPanel) this.joinRoomPanel.destroy();
        this.removeInputs();

        const panel = this.add.container(512, 384);
        panel.setDepth(100);
        
        // Panel background
        const bg = this.add.rectangle(0, 0, 600, 500, 0x1a1a3e, 0.95);
        bg.setStrokeStyle(3, 0x4a9eff);
        panel.add(bg);

        // Title
        const title = this.add.text(0, -200, 'CREATE ROOM', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#4a9eff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        panel.add(title);

        // Player Name (positioned above input field)
        // Input is at 40% of screen (307px), panel center is 384px, so relative: 307-384 = -77
        // Label should be 60px above input center: -77 - 60 = -137
        const nameLabel = this.add.text(0, -137, 'Player Name:', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        panel.add(nameLabel);

        this.playerNameInput = document.createElement('input');
        this.playerNameInput.type = 'text';
        this.playerNameInput.placeholder = 'Enter your name';
        this.playerNameInput.value = `Player${Math.floor(Math.random() * 1000)}`;
        this.playerNameInput.style.position = 'fixed';
        this.playerNameInput.style.left = '50%';
        this.playerNameInput.style.top = '40%';
        this.playerNameInput.style.transform = 'translate(-50%, -50%)';
        this.playerNameInput.style.width = '300px';
        this.playerNameInput.style.padding = '10px';
        this.playerNameInput.style.fontSize = '16px';
        this.playerNameInput.style.zIndex = '1000';
        this.playerNameInput.style.backgroundColor = '#ffffff';
        this.playerNameInput.style.border = '2px solid #4a9eff';
        this.playerNameInput.style.borderRadius = '4px';
        document.body.appendChild(this.playerNameInput);

        // Game Time (positioned above input field)
        // Input is at 50% of screen (384px), panel center is 384px, so relative: 0
        // Label should be 60px above input center: 0 - 60 = -60
        const timeLabel = this.add.text(0, -40, 'Game Time (seconds):', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        panel.add(timeLabel);

        this.gameTimeInput = document.createElement('input');
        this.gameTimeInput.type = 'number';
        this.gameTimeInput.value = '300';
        this.gameTimeInput.min = '60';
        this.gameTimeInput.max = '1800';
        this.gameTimeInput.style.position = 'fixed';
        this.gameTimeInput.style.left = '50%';
        this.gameTimeInput.style.top = '50%';
        this.gameTimeInput.style.transform = 'translate(-50%, -50%)';
        this.gameTimeInput.style.width = '300px';
        this.gameTimeInput.style.padding = '10px';
        this.gameTimeInput.style.fontSize = '16px';
        this.gameTimeInput.style.zIndex = '1000';
        this.gameTimeInput.style.backgroundColor = '#ffffff';
        this.gameTimeInput.style.border = '2px solid #4a9eff';
        this.gameTimeInput.style.borderRadius = '4px';
        
        // Add validation
        this.gameTimeInput.addEventListener('input', () => {
            const inputValue = this.gameTimeInput.value.trim();
            if (inputValue === '' || inputValue === '0' || /^0+$/.test(inputValue)) {
                this.gameTimeInput.value = '';
                this.gameTimeInput.style.borderColor = '#ff6b6b';
                return;
            }
            let value = parseInt(inputValue);
            if (isNaN(value) || value < 60) {
                this.gameTimeInput.style.borderColor = '#ff6b6b';
            } else if (value > 1800) {
                value = 1800;
                this.gameTimeInput.value = '1800';
                this.gameTimeInput.style.borderColor = '#4a9eff';
            } else {
                // Remove leading zeros
                this.gameTimeInput.value = value.toString();
                this.gameTimeInput.style.borderColor = '#4a9eff';
            }
        });
        
        this.gameTimeInput.addEventListener('blur', () => {
            const inputValue = this.gameTimeInput.value.trim();
            if (inputValue === '' || inputValue === '0' || /^0+$/.test(inputValue)) {
                this.gameTimeInput.value = '60';
                this.gameTimeInput.style.borderColor = '#4a9eff';
                return;
            }
            let value = parseInt(inputValue);
            if (isNaN(value) || value < 60) {
                this.gameTimeInput.value = '60';
            } else if (value > 1800) {
                this.gameTimeInput.value = '1800';
            } else {
                // Remove leading zeros
                this.gameTimeInput.value = value.toString();
            }
            this.gameTimeInput.style.borderColor = '#4a9eff';
        });
        
        document.body.appendChild(this.gameTimeInput);

        // Max Players (positioned above input field)
        // Input is at 60% of screen (461px), panel center is 384px, so relative: 461-384 = 77
        // Label should be 60px above input center: 77 - 60 = 17
        const maxLabel = this.add.text(0, 60, 'Max Players (2-6):', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        panel.add(maxLabel);

        this.maxPlayersInput = document.createElement('input');
        this.maxPlayersInput.type = 'number';
        this.maxPlayersInput.value = '6';
        this.maxPlayersInput.min = '2';
        this.maxPlayersInput.max = '6';
        this.maxPlayersInput.style.position = 'fixed';
        this.maxPlayersInput.style.left = '50%';
        this.maxPlayersInput.style.top = '60%';
        this.maxPlayersInput.style.transform = 'translate(-50%, -50%)';
        this.maxPlayersInput.style.width = '300px';
        this.maxPlayersInput.style.padding = '10px';
        this.maxPlayersInput.style.fontSize = '16px';
        this.maxPlayersInput.style.zIndex = '1000';
        this.maxPlayersInput.style.backgroundColor = '#ffffff';
        this.maxPlayersInput.style.border = '2px solid #4a9eff';
        this.maxPlayersInput.style.borderRadius = '4px';
        
        // Add validation
        this.maxPlayersInput.addEventListener('input', () => {
            const inputValue = this.maxPlayersInput.value.trim();
            if (inputValue === '' || inputValue === '0' || /^0+$/.test(inputValue)) {
                this.maxPlayersInput.value = '';
                this.maxPlayersInput.style.borderColor = '#ff6b6b';
                return;
            }
            let value = parseInt(inputValue);
            if (isNaN(value) || value < 2) {
                this.maxPlayersInput.style.borderColor = '#ff6b6b';
            } else if (value > 6) {
                value = 6;
                this.maxPlayersInput.value = '6';
                this.maxPlayersInput.style.borderColor = '#4a9eff';
            } else {
                // Remove leading zeros
                this.maxPlayersInput.value = value.toString();
                this.maxPlayersInput.style.borderColor = '#4a9eff';
            }
        });
        
        this.maxPlayersInput.addEventListener('blur', () => {
            const inputValue = this.maxPlayersInput.value.trim();
            if (inputValue === '' || inputValue === '0' || /^0+$/.test(inputValue)) {
                this.maxPlayersInput.value = '2';
                this.maxPlayersInput.style.borderColor = '#4a9eff';
                return;
            }
            let value = parseInt(inputValue);
            if (isNaN(value) || value < 2) {
                this.maxPlayersInput.value = '2';
            } else if (value > 6) {
                this.maxPlayersInput.value = '6';
            } else {
                // Remove leading zeros
                this.maxPlayersInput.value = value.toString();
            }
            this.maxPlayersInput.style.borderColor = '#4a9eff';
        });
        
        document.body.appendChild(this.maxPlayersInput);

        // Create button
        const createBtn = this.add.rectangle(0, 160, 200, 50, 0x4a9eff, 0.8);
        createBtn.setStrokeStyle(2, 0xffffff);
        createBtn.setInteractive({ useHandCursor: true });
        panel.add(createBtn);

        const createText = this.add.text(0, 160, 'CREATE', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        panel.add(createText);

        // Button hover effects
        createBtn.on('pointerover', () => {
            createBtn.setFillStyle(0x5ab0ff, 0.9);
        });
        createBtn.on('pointerout', () => {
            createBtn.setFillStyle(0x4a9eff, 0.8);
        });

        createBtn.on('pointerdown', () => {
            console.log('CREATE button clicked');
            // Check if network manager is connected
            if (!this.networkManager.getIsConnected()) {
                this.showError('Not connected to server. Please check if server is running.');
                console.error('Network manager not connected');
                // Try to reconnect
                this.networkManager.connect();
                return;
            }

            const playerName = this.playerNameInput.value.trim() || `Player${Math.floor(Math.random() * 1000)}`;
            const gameTime = parseInt(this.gameTimeInput.value) || 300;
            const maxPlayers = parseInt(this.maxPlayersInput.value) || 6;
            
            console.log('Creating room with:', { playerName, gameTime, maxPlayers });
            
            // Show loading message
            if (this.errorText) {
                this.errorText.setText('Creating room...');
                this.errorText.setColor('#4a9eff');
            }
            
            try {
                this.networkManager.createRoom(playerName, gameTime, Math.max(2, Math.min(6, maxPlayers)));
            } catch (error) {
                console.error('Error creating room:', error);
                this.showError('Failed to create room. Please try again.');
            }
        });

        // Error text
        this.errorText = this.add.text(0, 220, '', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        panel.add(this.errorText);

        // Back button (top-left of screen, outside panel)
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
            this.removeInputs();
            panel.destroy();
            this.showMainMenu();
        });

        this.createRoomPanel = panel;
    }

    showJoinRoomPanel() {
        // Remove any existing panels first
        if (this.createRoomPanel) this.createRoomPanel.destroy();
        if (this.joinRoomPanel) this.joinRoomPanel.destroy();
        this.removeInputs();

        const panel = this.add.container(512, 384);
        panel.setDepth(100);
        
        // Panel background
        const bg = this.add.rectangle(0, 0, 500, 350, 0x1a1a3e, 0.95);
        bg.setStrokeStyle(3, 0xff6b6b);
        panel.add(bg);

        // Title
        const title = this.add.text(0, -120, 'JOIN ROOM', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        panel.add(title);

        // Player Name (positioned above input field)
        // Input is at 45% of screen (346px), panel center is 384px, so relative: 346-384 = -38
        // Label should be 60px above input center: -38 - 60 = -98
        const nameLabel = this.add.text(0, -85, 'Player Name:', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        panel.add(nameLabel);

        this.playerNameInput = document.createElement('input');
        this.playerNameInput.type = 'text';
        this.playerNameInput.placeholder = 'Enter your name';
        this.playerNameInput.value = `Player${Math.floor(Math.random() * 1000)}`;
        this.playerNameInput.style.position = 'fixed';
        this.playerNameInput.style.left = '50%';
        this.playerNameInput.style.top = '45%';
        this.playerNameInput.style.transform = 'translate(-50%, -50%)';
        this.playerNameInput.style.width = '300px';
        this.playerNameInput.style.padding = '10px';
        this.playerNameInput.style.fontSize = '16px';
        this.playerNameInput.style.zIndex = '1000';
        this.playerNameInput.style.backgroundColor = '#ffffff';
        this.playerNameInput.style.border = '2px solid #ff6b6b';
        this.playerNameInput.style.borderRadius = '4px';
        document.body.appendChild(this.playerNameInput);

        // Room Code (positioned above input field)
        // Input is at 55% of screen (422px), panel center is 384px, so relative: 422-384 = 38
        // Label should be 60px above input center: 38 - 60 = -22
        const codeLabel = this.add.text(0, 10, 'Room Code:', {
            fontFamily: 'Arial',
            fontSize: 20,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        panel.add(codeLabel);

        this.roomCodeInput = document.createElement('input');
        this.roomCodeInput.type = 'text';
        this.roomCodeInput.placeholder = 'Enter room code';
        this.roomCodeInput.style.textTransform = 'uppercase';
        this.roomCodeInput.style.position = 'fixed';
        this.roomCodeInput.style.left = '50%';
        this.roomCodeInput.style.top = '55%';
        this.roomCodeInput.style.transform = 'translate(-50%, -50%)';
        this.roomCodeInput.style.width = '300px';
        this.roomCodeInput.style.padding = '10px';
        this.roomCodeInput.style.fontSize = '16px';
        this.roomCodeInput.style.textAlign = 'center';
        this.roomCodeInput.style.zIndex = '1000';
        this.roomCodeInput.style.backgroundColor = '#ffffff';
        this.roomCodeInput.style.border = '2px solid #ff6b6b';
        this.roomCodeInput.style.borderRadius = '4px';
        document.body.appendChild(this.roomCodeInput);

        // Join button
        const joinBtn = this.add.rectangle(0, 120, 200, 50, 0xff6b6b, 0.8);
        joinBtn.setStrokeStyle(2, 0xffffff);
        joinBtn.setInteractive({ useHandCursor: true });
        panel.add(joinBtn);

        const joinText = this.add.text(0, 120, 'JOIN', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        panel.add(joinText);

        joinBtn.on('pointerdown', () => {
            const playerName = this.playerNameInput.value || `Player${Math.floor(Math.random() * 1000)}`;
            const roomCode = this.roomCodeInput.value.toUpperCase().trim();
            
            if (!roomCode) {
                this.showError('Please enter a room code');
                return;
            }
            
            this.networkManager.joinRoom(roomCode, playerName);
        });

        // Error text
        this.errorText = this.add.text(0, 190, '', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ff6b6b',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        panel.add(this.errorText);

        // Back button (top-left of screen, outside panel)
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
            this.removeInputs();
            panel.destroy();
            this.showMainMenu();
        });

        this.joinRoomPanel = panel;
    }

    showLobbyPanel(room: Room) {
        // Hide other panels
        if (this.createRoomPanel) this.createRoomPanel.destroy();
        if (this.joinRoomPanel) this.joinRoomPanel.destroy();
        this.removeInputs();

        const panel = this.add.container(512, 384);
        
        // Panel background
        const bg = this.add.rectangle(0, 0, 700, 600, 0x1a1a3e, 0.95);
        bg.setStrokeStyle(3, 0x4a9eff);
        panel.add(bg);

        // Room Code display
        this.roomCodeText = this.add.text(0, -250, `ROOM CODE: ${room.code}`, {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#4a9eff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        panel.add(this.roomCodeText);

        // Players list
        this.updatePlayersList(room, panel);

        // Ready button (for all players)
        this.readyBtn = this.add.rectangle(-150, 200, 200, 50, 0x00ff88, 0.8);
        this.readyBtn.setStrokeStyle(2, 0xffffff);
        this.readyBtn.setInteractive({ useHandCursor: true });
        panel.add(this.readyBtn);

        const readyText = this.add.text(-150, 200, 'READY', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        panel.add(readyText);

        this.readyBtn.on('pointerdown', () => {
            this.networkManager.toggleReady();
        });

        // Start button (host only)
        if (this.isHost) {
            this.startBtn = this.add.rectangle(150, 200, 200, 50, 0xffa500, 0.8);
            this.startBtn.setStrokeStyle(2, 0xffffff);
            this.startBtn.setInteractive({ useHandCursor: true });
            panel.add(this.startBtn);

            const startText = this.add.text(150, 200, 'START GAME', {
                fontFamily: 'Arial Black',
                fontSize: 24,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            panel.add(startText);

            this.startBtn.on('pointerdown', () => {
                this.networkManager.startGame();
            });
        }

        // Back button (top-left of screen, outside panel)
        const backBtnContainer = this.add.container(100, 50);
        backBtnContainer.setDepth(200);
        
        this.backBtn = this.add.rectangle(0, 0, 150, 50, 0x666666, 0.9);
        this.backBtn.setStrokeStyle(2, 0xffffff);
        this.backBtn.setInteractive({ useHandCursor: true });
        backBtnContainer.add(this.backBtn);

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

        this.backBtn.on('pointerover', () => {
            this.backBtn.setFillStyle(0x777777, 1);
            backBtnContainer.setScale(1.05);
        });
        this.backBtn.on('pointerout', () => {
            this.backBtn.setFillStyle(0x666666, 0.9);
            backBtnContainer.setScale(1);
        });
        this.backBtn.on('pointerdown', () => {
            this.networkManager.leaveRoom();
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Lobby');
            });
        });

        this.lobbyPanel = panel;
    }

    updatePlayersList(room: Room, panel?: Phaser.GameObjects.Container) {
        if (this.playersList) {
            this.playersList.destroy();
        }

        if (!panel && this.lobbyPanel) {
            panel = this.lobbyPanel;
        }

        if (!panel) return;

        this.playersList = this.add.container(0, -50);
        panel.add(this.playersList);

        room.players.forEach((player, index) => {
            const yPos = -100 + (index * 60);
            
            // Player background
            const playerBg = this.add.rectangle(0, yPos, 600, 50, 
                player.id === this.networkManager.getSocketId() ? 0x2a4a6e : 0x2a2a4e, 0.8);
            playerBg.setStrokeStyle(2, this.isHost && player.id === room.host ? 0xffa500 : 0x4a9eff);
            this.playersList.add(playerBg);

            // Player color indicator
            const colorCircle = this.add.circle(-250, yPos, 15, player.color, 1);
            this.playersList.add(colorCircle);

            // Player name
            const nameText = this.add.text(-200, yPos, player.name, {
                fontFamily: 'Arial',
                fontSize: 20,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0, 0.5);
            this.playersList.add(nameText);

            // Host indicator
            if (player.id === room.host) {
                const hostText = this.add.text(200, yPos, '[HOST]', {
                    fontFamily: 'Arial',
                    fontSize: 16,
                    color: '#ffa500',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0, 0.5);
                this.playersList.add(hostText);
            }

            // Ready status (✓ for ready, ✗ for not ready)
            const readyIcon = player.ready ? '✓' : '✗';
            const readyStatus = this.add.text(260, yPos, readyIcon, {
                fontFamily: 'Arial Black',
                fontSize: 28,
                color: player.ready ? '#00ff88' : '#ff6b6b',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);
            this.playersList.add(readyStatus);
        });
    }

    setupNetworkEvents() {
        this.networkManager.onRoomCreated = (room) => {
            console.log('Room created:', room);
            this.currentRoom = room;
            this.currentPlayer = this.networkManager.getCurrentPlayer();
            this.isHost = this.networkManager.getIsHost();
            this.removeInputs(); // Remove input fields before showing lobby
            this.showLobbyPanel(room);
        };

        this.networkManager.onRoomJoined = (room, player) => {
            this.currentRoom = room;
            this.currentPlayer = player;
            this.isHost = this.networkManager.getIsHost();
            this.showLobbyPanel(room);
        };

        this.networkManager.onJoinError = (message) => {
            console.error('Join error:', message);
            this.showError(message);
        };

        this.networkManager.onPlayerJoined = (room) => {
            this.currentRoom = room;
            this.updatePlayersList(room);
        };

        this.networkManager.onPlayerLeft = (room) => {
            this.currentRoom = room;
            this.updatePlayersList(room);
        };

        this.networkManager.onPlayerReady = (room, _playerId, _ready) => {
            this.currentRoom = room;
            this.updatePlayersList(room);
        };

        this.networkManager.onHostTransferred = (_newHost, room) => {
            this.currentRoom = room;
            this.isHost = this.networkManager.getIsHost();
            if (this.lobbyPanel) {
                // Recreate lobby panel to show/hide start button
                this.showLobbyPanel(room);
            }
        };

        this.networkManager.onGameStarted = (room, startTime) => {
            this.removeInputs();
            // Store network manager in registry for MultiplayerGame scene
            this.registry.set('networkManager', this.networkManager);
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MultiplayerGame', { room, startTime });
            });
        };
    }

    showError(message: string) {
        if (this.errorText) {
            this.errorText.setText(message);
            this.tweens.add({
                targets: this.errorText,
                alpha: 0,
                duration: 3000,
                onComplete: () => {
                    this.errorText.setText('');
                    this.errorText.setAlpha(1);
                }
            });
        }
    }

    removeInputs() {
        if (this.playerNameInput && this.playerNameInput.parentNode) {
            this.playerNameInput.parentNode.removeChild(this.playerNameInput);
        }
        if (this.roomCodeInput && this.roomCodeInput.parentNode) {
            this.roomCodeInput.parentNode.removeChild(this.roomCodeInput);
        }
        if (this.gameTimeInput && this.gameTimeInput.parentNode) {
            this.gameTimeInput.parentNode.removeChild(this.gameTimeInput);
        }
        if (this.maxPlayersInput && this.maxPlayersInput.parentNode) {
            this.maxPlayersInput.parentNode.removeChild(this.maxPlayersInput);
        }
    }

    shutdown() {
        this.removeInputs();
        if (this.networkManager) {
            this.networkManager.disconnect();
        }
    }
}

