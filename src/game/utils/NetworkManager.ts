import { io, Socket } from 'socket.io-client';

export interface Player {
    id: string;
    name: string;
    color: number;
    ready: boolean;
    score: number;
    alive: boolean;
}

export interface Room {
    code: string;
    host: string;
    players: Player[];
    gameTime: number;
    maxPlayers: number;
    gameStarted: boolean;
    gameEnded: boolean;
    startTime: number | null;
}

export class NetworkManager {
    private socket: Socket | null = null;
    private serverUrl: string;
    private isConnected: boolean = false;
    private currentRoom: Room | null = null;
    private currentPlayer: Player | null = null;
    private isHost: boolean = false;

    // Event callbacks
    public onRoomCreated?: (room: Room) => void;
    public onRoomJoined?: (room: Room, player: Player) => void;
    public onJoinError?: (message: string) => void;
    public onPlayerJoined?: (room: Room, newPlayer: Player) => void;
    public onPlayerLeft?: (room: Room) => void;
    public onPlayerReady?: (room: Room, playerId: string, ready: boolean) => void;
    public onHostTransferred?: (newHost: string, room: Room) => void;
    public onGameStarted?: (room: Room, startTime: number) => void;
    public onPlayerMoved?: (playerId: string, x: number, y: number) => void;
    public onPlayerShot?: (playerId: string, bullet: any) => void;
    public onEnemySpawned?: (enemy: any) => void;
    public onEnemyDestroyed?: (enemyId: string, position: { x: number; y: number }) => void;
    public onScoreUpdate?: (playerId: string, score: number) => void;
    public onPlayerDied?: (playerId: string, room: Room) => void;
    public onGameEnded?: (room: Room, rankings: Player[], reason: string) => void;
    public onTimerUpdate?: (timeRemaining: number) => void;

    constructor(serverUrl: string = 'http://localhost:3000') {
        this.serverUrl = serverUrl;
    }

    connect(): void {
        if (this.socket?.connected) return;

        this.socket = io(this.serverUrl, {
            transports: ['websocket']
        });

        this.socket.on('connect', () => {
            console.log('Connected to server, socket ID:', this.socket?.id);
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.isConnected = false;
        });

        // Room events
        this.socket.on('roomCreated', (data: { roomCode: string; room: Room }) => {
            this.currentRoom = data.room;
            this.isHost = true;
            this.currentPlayer = data.room.players.find(p => p.id === this.socket?.id) || null;
            this.onRoomCreated?.(data.room);
        });

        this.socket.on('roomJoined', (data: { room: Room; player: Player }) => {
            this.currentRoom = data.room;
            this.currentPlayer = data.player;
            this.isHost = data.room.host === this.socket?.id;
            this.onRoomJoined?.(data.room, data.player);
        });

        this.socket.on('joinError', (data: { message: string }) => {
            this.onJoinError?.(data.message);
        });

        this.socket.on('playerJoined', (data: { room: Room; newPlayer: Player }) => {
            this.currentRoom = data.room;
            this.onPlayerJoined?.(data.room, data.newPlayer);
        });

        this.socket.on('playerLeft', (data: { room: Room }) => {
            this.currentRoom = data.room;
            this.onPlayerLeft?.(data.room);
        });

        this.socket.on('playerReady', (data: { room: Room; playerId: string; ready: boolean }) => {
            this.currentRoom = data.room;
            this.onPlayerReady?.(data.room, data.playerId, data.ready);
        });

        this.socket.on('hostTransferred', (data: { newHost: string; room: Room }) => {
            this.currentRoom = data.room;
            this.isHost = data.newHost === this.socket?.id;
            this.onHostTransferred?.(data.newHost, data.room);
        });

        this.socket.on('gameStarted', (data: { room: Room; startTime: number }) => {
            this.currentRoom = data.room;
            this.onGameStarted?.(data.room, data.startTime);
        });

        this.socket.on('startError', (data: { message: string }) => {
            console.error('Start error:', data.message);
        });

        // Game events
        this.socket.on('playerMoved', (data: { playerId: string; x: number; y: number }) => {
            this.onPlayerMoved?.(data.playerId, data.x, data.y);
        });

        this.socket.on('playerShot', (data: { playerId: string; bullet: any }) => {
            this.onPlayerShot?.(data.playerId, data.bullet);
        });

        this.socket.on('enemySpawned', (data: { enemy: any }) => {
            this.onEnemySpawned?.(data.enemy);
        });

        this.socket.on('enemyDestroyed', (data: { enemyId: string; position: { x: number; y: number } }) => {
            this.onEnemyDestroyed?.(data.enemyId, data.position);
        });

        this.socket.on('scoreUpdate', (data: { playerId: string; score: number }) => {
            this.onScoreUpdate?.(data.playerId, data.score);
        });

        this.socket.on('playerDied', (data: { playerId: string; room: Room }) => {
            this.currentRoom = data.room;
            this.onPlayerDied?.(data.playerId, data.room);
        });

        this.socket.on('gameEnded', (data: { room: Room; rankings: Player[]; reason: string }) => {
            this.currentRoom = data.room;
            this.onGameEnded?.(data.room, data.rankings, data.reason);
        });

        this.socket.on('timerUpdate', (data: { timeRemaining: number }) => {
            this.onTimerUpdate?.(data.timeRemaining);
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.currentRoom = null;
        this.currentPlayer = null;
        this.isHost = false;
    }

    createRoom(playerName: string, gameTime: number = 300, maxPlayers: number = 6): void {
        if (!this.socket) {
            console.error('Socket not initialized');
            return;
        }
        if (!this.socket.connected) {
            console.error('Socket not connected');
            return;
        }
        console.log('Emitting createRoom event:', { playerName, gameTime, maxPlayers });
        this.socket.emit('createRoom', { playerName, gameTime, maxPlayers });
    }

    joinRoom(roomCode: string, playerName: string): void {
        if (!this.socket) return;
        this.socket.emit('joinRoom', { roomCode: roomCode.toUpperCase(), playerName });
    }

    leaveRoom(): void {
        if (!this.socket) return;
        this.socket.emit('leaveRoom');
        this.currentRoom = null;
        this.currentPlayer = null;
        this.isHost = false;
    }

    toggleReady(): void {
        if (!this.socket) return;
        this.socket.emit('toggleReady');
    }

    startGame(): void {
        if (!this.socket || !this.isHost) return;
        this.socket.emit('startGame');
    }

    sendPlayerMove(x: number, y: number): void {
        if (!this.socket) return;
        this.socket.emit('playerMove', { x, y });
    }

    sendPlayerShoot(bullet: any): void {
        if (!this.socket) return;
        this.socket.emit('playerShoot', { bullet });
    }

    sendEnemySpawn(enemy: any): void {
        if (!this.socket || !this.isHost) return;
        this.socket.emit('enemySpawn', { enemy });
    }

    sendEnemyHit(enemyId: string, points: number, position: { x: number; y: number }): void {
        if (!this.socket) return;
        this.socket.emit('enemyHit', { enemyId, points, position });
    }

    sendPlayerHit(): void {
        if (!this.socket) return;
        this.socket.emit('playerHit');
    }

    requestTimer(): void {
        if (!this.socket) return;
        this.socket.emit('requestTimer');
    }

    getCurrentRoom(): Room | null {
        return this.currentRoom;
    }

    getCurrentPlayer(): Player | null {
        return this.currentPlayer;
    }

    getIsHost(): boolean {
        return this.isHost;
    }

    getIsConnected(): boolean {
        return this.isConnected;
    }

    getSocketId(): string | undefined {
        return this.socket?.id;
    }
}

