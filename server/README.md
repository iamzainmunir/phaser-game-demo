# Space Shooter Multiplayer Server

This is the Node.js server for the Space Shooter multiplayer game.

## Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000` by default.

## Environment Variables

You can set the port using the `PORT` environment variable:
```bash
PORT=3000 npm start
```

## Features

- Room creation with unique codes
- Up to 6 players per room
- Host management with automatic host transfer
- Ready system before game start
- Real-time game synchronization
- Score tracking and rankings
- Timer-based game end

## API Events

### Client to Server
- `createRoom` - Create a new game room
- `joinRoom` - Join an existing room
- `leaveRoom` - Leave current room
- `toggleReady` - Toggle ready status
- `startGame` - Start the game (host only)
- `playerMove` - Send player position
- `playerShoot` - Send bullet creation
- `enemySpawn` - Spawn enemy (host only)
- `enemyHit` - Enemy was hit
- `playerHit` - Player was hit
- `requestTimer` - Request timer update

### Server to Client
- `roomCreated` - Room was created
- `roomJoined` - Successfully joined room
- `joinError` - Error joining room
- `playerJoined` - New player joined
- `playerLeft` - Player left room
- `playerReady` - Player ready status changed
- `hostTransferred` - Host was transferred
- `gameStarted` - Game has started
- `playerMoved` - Player moved
- `playerShot` - Player shot
- `enemySpawned` - Enemy spawned
- `enemyDestroyed` - Enemy destroyed
- `scoreUpdate` - Score updated
- `playerDied` - Player died
- `gameEnded` - Game ended
- `timerUpdate` - Timer update

