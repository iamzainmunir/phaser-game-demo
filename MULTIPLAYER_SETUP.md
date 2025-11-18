# Multiplayer Setup Guide

This guide will help you set up and run the multiplayer Space Shooter game.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Setup Instructions

### 1. Install Client Dependencies

In the root directory:
```bash
npm install
```

This will install:
- Phaser 3
- Socket.io-client
- Other game dependencies

### 2. Install Server Dependencies

Navigate to the server directory:
```bash
cd server
npm install
```

This will install:
- Express
- Socket.io
- CORS

### 3. Start the Server

In the `server` directory:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.

### 4. Start the Client

In the root directory (in a new terminal):
```bash
npm run dev
```

The game will be available at `http://localhost:8080`

## How to Play Multiplayer

1. **Start the server first** (important!)
2. Start the client game
3. Click "MULTIPLAYER" on the main menu
4. Choose one of:
   - **CREATE ROOM**: Create a new game room
     - Enter your player name
     - Set game time (60-1800 seconds)
     - Set max players (2-6)
     - Click CREATE
     - Share the room code with friends
   - **JOIN ROOM**: Join an existing room
     - Enter your player name
     - Enter the room code
     - Click JOIN

5. **In the Lobby**:
   - See all players in the room
   - Click "READY" when you're ready
   - Host clicks "START GAME" when all players are ready

6. **During the Game**:
   - Each player only sees their own score
   - All players compete against shared enemies
   - Game ends when:
     - All players die, OR
     - Timer runs out

7. **Game Over**:
   - See final rankings
   - Top 3 players get medals
   - Your position is highlighted

## Features

✅ Room creation with unique codes  
✅ Up to 6 players per room  
✅ Player names and colors  
✅ Ready system  
✅ Host management with auto-transfer  
✅ Timer-based game end  
✅ Competitive scoring  
✅ Real-time synchronization  
✅ Rankings display  

## Troubleshooting

### Server won't start
- Make sure port 3000 is not in use
- Check Node.js version: `node --version`
- Try a different port: `PORT=3001 npm start`

### Can't connect to server
- Make sure server is running
- Check server URL in `NetworkManager.ts` (default: `http://localhost:3000`)
- Check browser console for errors

### Players not syncing
- Make sure all players are on the same network (for local play)
- For online play, update server URL to your server's IP/domain

## Development

### Changing Server Port

Edit `server/server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Change 3000 to your port
```

Update `NetworkManager.ts`:
```typescript
constructor(serverUrl: string = 'http://localhost:YOUR_PORT')
```

### Adding More Features

- Server logic: `server/server.js`
- Client networking: `src/game/utils/NetworkManager.ts`
- Lobby UI: `src/game/scenes/Lobby.ts`
- Game logic: `src/game/scenes/MultiplayerGame.ts`

## Production Deployment

1. Build the client:
```bash
npm run build
```

2. Deploy the `dist` folder to a static host (Netlify, Vercel, etc.)

3. Deploy the server to a Node.js host (Heroku, Railway, etc.)

4. Update the server URL in `NetworkManager.ts` to your production server URL

## Notes

- Single Player mode works offline (no server needed)
- Multiplayer requires the server to be running
- Room codes are case-insensitive
- Host can start game only when all players are ready
- If host disconnects, host is automatically transferred

