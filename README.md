# Space Shooter - Multiplayer Game

A beautiful, feature-rich space shooter game built with Phaser 3, TypeScript, and Socket.io. Battle enemies in single-player mode or compete with friends in real-time multiplayer matches!

![Game Screenshot](screenshot.png)

## 🎮 About the Game

Space Shooter is an arcade-style top-down space shooter where you pilot a spaceship through waves of enemies. Destroy enemies to score points, avoid collisions to survive, and compete for the highest score!

### Game Modes

- **Single Player**: Classic arcade mode - survive as long as possible and beat your high score
- **Multiplayer**: Compete with up to 6 players in real-time matches with custom game timers

### Features

✨ **Single Player Mode**
- Smooth spaceship controls
- Multiple enemy types with different behaviors
- Progressive difficulty
- Score tracking
- Lives system
- Beautiful particle effects and explosions

🎯 **Multiplayer Mode**
- Create or join game rooms with unique codes
- Up to 6 players per room
- Real-time synchronization
- Competitive scoring (each player sees only their own score)
- Timer-based or elimination-based game end
- Final rankings with medals for top 3 players
- Spectator mode for eliminated players
- Host management with automatic transfer

🎨 **Visual Features**
- Detailed spaceship graphics
- Animated starfield background
- Particle explosion effects
- Engine trails
- Smooth animations and transitions
- Camera shake effects

🔊 **Audio**
- Shooting sound effects
- Explosion sounds
- Hit feedback sounds
- Programmatically generated audio (no external files needed)

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd first-game
   ```

2. **Install client dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Game

#### Single Player Mode

1. Start the client:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:8080`

3. Click "SINGLE PLAYER" and start playing!

#### Multiplayer Mode

1. **Start the server** (in one terminal):
   ```bash
   cd server
   npm start
   ```
   The server will run on `http://localhost:3000`

2. **Start the client** (in another terminal):
   ```bash
   npm run dev
   ```

3. Open `http://localhost:8080` in your browser

4. Click "MULTIPLAYER" → "CREATE ROOM" or "JOIN ROOM"

5. Share the room code with friends!

#### Network Access (For Players on Different Devices)

To allow players on your local network to join:

1. **Start server** (already network-ready):
   ```bash
   cd server
   npm start
   ```

2. **Start client with network access**:
   ```bash
   npm run dev-network
   ```

3. Find your IP address:
   - **macOS/Linux**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows**: `ipconfig`

4. Share the Network URL (e.g., `http://192.168.1.100:8080`) with other players

5. Other players need to update `src/game/utils/NetworkManager.ts` with your IP:
   ```typescript
   constructor(serverUrl: string = 'http://YOUR_IP:3000')
   ```

See [NETWORK_SETUP.md](NETWORK_SETUP.md) for detailed network setup instructions.

## 📁 Project Structure

```
first-game/
├── server/                 # Node.js multiplayer server
│   ├── server.js          # Socket.io server implementation
│   ├── package.json       # Server dependencies
│   └── README.md         # Server documentation
├── src/
│   ├── game/
│   │   ├── scenes/        # Phaser game scenes
│   │   │   ├── Boot.ts           # Initial loading scene
│   │   │   ├── Preloader.ts      # Asset loading scene
│   │   │   ├── MainMenu.ts        # Main menu with mode selection
│   │   │   ├── Game.ts            # Single player game scene
│   │   │   ├── GameOver.ts        # Single player game over
│   │   │   ├── Lobby.ts           # Multiplayer lobby
│   │   │   ├── MultiplayerGame.ts # Multiplayer game scene
│   │   │   └── MultiplayerGameOver.ts # Multiplayer rankings
│   │   ├── utils/
│   │   │   ├── NetworkManager.ts      # Socket.io client wrapper
│   │   │   ├── SoundManager.ts        # Audio management
│   │   │   └── SpaceshipGraphics.ts   # Spaceship rendering utilities
│   │   └── main.ts        # Game configuration
│   └── main.ts            # Application entry point
├── public/
│   └── assets/            # Game assets (images, etc.)
├── vite/                  # Vite configuration files
├── package.json           # Client dependencies
└── README.md             # This file
```

## 🎮 How to Play

### Controls

- **Arrow Keys**: Move your spaceship
- **Spacebar**: Shoot bullets
- **Mouse Click**: Navigate menus

### Gameplay

1. **Movement**: Use arrow keys to navigate your ship around the screen
2. **Shooting**: Hold or tap spacebar to fire bullets at enemies
3. **Scoring**: Destroy enemies to earn points:
   - Small enemies (red): 10 points
   - Medium enemies (orange): 20 points
   - Large enemies (purple): 30 points
4. **Lives**: You start with 3 lives. Lose a life when hit by an enemy
5. **Game Over**: Game ends when you run out of lives

### Multiplayer Rules

- All players compete against shared enemies
- Each player only sees their own score during the game
- Game ends when:
  - All players are eliminated, OR
  - Timer runs out
- Final rankings show all players' scores
- Eliminated players enter spectator mode

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install client dependencies |
| `npm run dev` | Start development server (localhost only) |
| `npm run dev-network` | Start development server (network accessible) |
| `npm run build` | Create production build |
| `cd server && npm start` | Start multiplayer server |
| `cd server && npm run dev` | Start server with auto-reload |

## 🏗️ Technologies Used

- **Phaser 3.90.0** - Game framework
- **TypeScript 5.7.2** - Type-safe JavaScript
- **Vite 6.3.1** - Build tool and dev server
- **Socket.io 4.7.2** - Real-time multiplayer networking
- **Express** - Server framework
- **Node.js** - Server runtime

## 📚 Documentation

- **[MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md)** - Detailed multiplayer setup guide
- **[NETWORK_SETUP.md](NETWORK_SETUP.md)** - Network access configuration
- **[server/README.md](server/README.md)** - Server documentation

## 🎯 Features in Detail

### Single Player Features
- Progressive difficulty (enemy spawn rate increases with score)
- Score tracking
- Lives system with visual feedback
- Smooth controls and responsive gameplay

### Multiplayer Features
- **Room System**: Create rooms with unique codes or join existing ones
- **Player Management**: 
  - Custom player names
  - Unique ship colors per player
  - Ready system before game start
- **Host Management**: 
  - Host can start the game
  - Automatic host transfer if host disconnects
- **Game Configuration**:
  - Customizable game timer (60-1800 seconds)
  - Configurable max players (2-6)
- **Real-time Synchronization**:
  - Shared enemy spawning (host-controlled)
  - Player movement sync
  - Score updates
  - Game state management

## 🐛 Troubleshooting

### Server won't start
- Make sure port 3000 is not in use
- Check Node.js version: `node --version` (should be v14+)
- Try a different port: `PORT=3001 npm start` (in server directory)

### Can't connect to server
- Verify server is running: `cd server && npm start`
- Check browser console for errors
- Ensure server URL in `NetworkManager.ts` matches your server

### Players not syncing
- All players must be on the same network (for local play)
- Check server logs for connection errors
- Verify firewall allows ports 3000 and 8080

### Blank screen in multiplayer
- Check browser console for errors
- Verify server is running
- Check network connection

## 🚢 Deployment

### Production Build

1. **Build the client**:
   ```bash
   npm run build
   ```
   Output will be in the `dist` folder.

2. **Deploy client**: Upload `dist` folder contents to a static host:
   - Netlify
   - Vercel
   - GitHub Pages
   - Any static hosting service

3. **Deploy server**: Deploy `server` folder to a Node.js host:
   - Heroku
   - Railway
   - DigitalOcean
   - AWS/GCP/Azure

4. **Update server URL**: Edit `src/game/utils/NetworkManager.ts` to point to your production server URL before building.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Phaser 3](https://phaser.io/)
- Uses [Socket.io](https://socket.io/) for multiplayer
- Template based on [Phaser Vite TypeScript Template](https://github.com/phaserjs/template-vite-ts)

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the documentation files
- Review the Phaser community resources

---

**Enjoy the game! 🚀**

---

## 📄 Additional Notes

### About log.js

This project includes a `log.js` file that sends anonymous usage data to Phaser Studio. This helps them understand template usage. You can disable it by:

- Using `npm run dev-nolog` or `npm run build-nolog`
- Or removing the `log.js` file and updating `package.json` scripts

### Development Tips

- Hot reload is enabled - changes in `src/` will automatically reload the browser
- Check browser console (F12) for debugging information
- Server logs will show connection status and room activity
- Use `npm run dev-network` to test multiplayer on local network

### Asset Management

Assets can be loaded in two ways:
- **Import directly**: `import logoImg from './assets/logo.png'`
- **Public folder**: Place files in `public/assets/` and reference as `'assets/filename.png'`

---

**Made with ❤️ using Phaser 3**
