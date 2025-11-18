import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store rooms and players
const rooms = new Map();
const players = new Map();

// Generate unique room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get player color based on index
function getPlayerColor(index) {
  const colors = [
    0x4a9eff, // Blue
    0xff6b6b, // Red
    0x00ff88, // Green
    0xffa500, // Orange
    0x9b59b6, // Purple
    0x00ffff  // Cyan
  ];
  return colors[index % colors.length];
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create room
  socket.on('createRoom', (data) => {
    const { playerName, gameTime, maxPlayers } = data;
    const roomCode = generateRoomCode();
    
    const room = {
      code: roomCode,
      host: socket.id,
      players: [{
        id: socket.id,
        name: playerName || `Player ${socket.id.substring(0, 6)}`,
        color: getPlayerColor(0),
        ready: false,
        score: 0,
        alive: true
      }],
      gameTime: gameTime || 300, // Default 5 minutes
      maxPlayers: maxPlayers || 6,
      gameStarted: false,
      gameEnded: false,
      startTime: null
    };

    rooms.set(roomCode, room);
    players.set(socket.id, { roomCode, isHost: true });
    
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, room });
    console.log(`Room created: ${roomCode} by ${socket.id}`);
  });

  // Join room
  socket.on('joinRoom', (data) => {
    const { roomCode, playerName } = data;
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('joinError', { message: 'Room not found' });
      return;
    }

    if (room.gameStarted) {
      socket.emit('joinError', { message: 'Game already started' });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('joinError', { message: 'Room is full' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName || `Player ${socket.id.substring(0, 6)}`,
      color: getPlayerColor(room.players.length),
      ready: false,
      score: 0,
      alive: true
    };

    room.players.push(player);
    players.set(socket.id, { roomCode, isHost: false });
    
    socket.join(roomCode);
    socket.emit('roomJoined', { room, player });
    io.to(roomCode).emit('playerJoined', { room, newPlayer: player });
    console.log(`${socket.id} joined room ${roomCode}`);
  });

  // Leave room
  socket.on('leaveRoom', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const room = rooms.get(playerData.roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    players.delete(socket.id);
    socket.leave(playerData.roomCode);

    // If host left, transfer host to first player
    if (playerData.isHost && room.players.length > 0) {
      room.host = room.players[0].id;
      players.set(room.players[0].id, { ...players.get(room.players[0].id), isHost: true });
      io.to(roomCode).emit('hostTransferred', { newHost: room.players[0].id, room });
    }

    // If no players left, delete room
    if (room.players.length === 0) {
      rooms.delete(playerData.roomCode);
      console.log(`Room ${playerData.roomCode} deleted`);
    } else {
      io.to(playerData.roomCode).emit('playerLeft', { room });
    }
  });

  // Toggle ready
  socket.on('toggleReady', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = !player.ready;
      io.to(playerData.roomCode).emit('playerReady', { room, playerId: socket.id, ready: player.ready });
    }
  });

  // Start game
  socket.on('startGame', () => {
    const playerData = players.get(socket.id);
    if (!playerData || !playerData.isHost) return;

    const room = rooms.get(playerData.roomCode);
    if (!room || room.gameStarted) return;

    // Check if all players are ready
    const allReady = room.players.every(p => p.ready);
    if (!allReady) {
      socket.emit('startError', { message: 'Not all players are ready' });
      return;
    }

    room.gameStarted = true;
    room.startTime = Date.now();
    room.players.forEach(p => {
      p.ready = false;
      p.score = 0;
      p.alive = true;
    });

    io.to(playerData.roomCode).emit('gameStarted', { room, startTime: room.startTime });
    console.log(`Game started in room ${playerData.roomCode}`);
  });

  // Player movement
  socket.on('playerMove', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const room = rooms.get(playerData.roomCode);
    if (!room || !room.gameStarted) return;

    socket.to(playerData.roomCode).emit('playerMoved', {
      playerId: socket.id,
      x: data.x,
      y: data.y
    });
  });

  // Player shoot
  socket.on('playerShoot', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const room = rooms.get(playerData.roomCode);
    if (!room || !room.gameStarted) return;

    socket.to(playerData.roomCode).emit('playerShot', {
      playerId: socket.id,
      bullet: data.bullet
    });
  });

  // Enemy spawn (host only)
  socket.on('enemySpawn', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData || !playerData.isHost) return;

    const room = rooms.get(playerData.roomCode);
    if (!room || !room.gameStarted) return;

    io.to(playerData.roomCode).emit('enemySpawned', {
      enemy: data.enemy
    });
  });

  // Enemy hit
  socket.on('enemyHit', (data) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const room = rooms.get(playerData.roomCode);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.score += data.points || 10;
      io.to(playerData.roomCode).emit('scoreUpdate', {
        playerId: socket.id,
        score: player.score
      });
    }

    // Broadcast enemy destruction to all clients
    io.to(playerData.roomCode).emit('enemyDestroyed', {
      enemyId: data.enemyId,
      position: data.position
    });
  });

  // Player hit
  socket.on('playerHit', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const room = rooms.get(playerData.roomCode);
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.alive = false;
      io.to(playerData.roomCode).emit('playerDied', {
        playerId: socket.id,
        room
      });

      // Check if game should end
      checkGameEnd(playerData.roomCode);
    }
  });

  // Check game end conditions
  function checkGameEnd(roomCode) {
    const room = rooms.get(roomCode);
    if (!room || room.gameEnded) return;

    const alivePlayers = room.players.filter(p => p.alive);
    const elapsed = (Date.now() - room.startTime) / 1000;
    const timeRemaining = room.gameTime - elapsed;

    // Game ends if: all players dead OR timer expired
    if (alivePlayers.length === 0 || timeRemaining <= 0) {
      room.gameEnded = true;
      room.endTime = Date.now();
      
      // Sort players by score
      const rankings = [...room.players].sort((a, b) => b.score - a.score);
      
      io.to(roomCode).emit('gameEnded', {
        room,
        rankings,
        reason: alivePlayers.length === 0 ? 'all_dead' : 'time_up'
      });
    }
  }

  // Update timer (sent periodically)
  socket.on('requestTimer', () => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const room = rooms.get(playerData.roomCode);
    if (!room || !room.gameStarted || room.gameEnded) return;

    const elapsed = (Date.now() - room.startTime) / 1000;
    const timeRemaining = Math.max(0, room.gameTime - elapsed);

    socket.emit('timerUpdate', { timeRemaining });

    if (timeRemaining <= 0) {
      checkGameEnd(playerData.roomCode);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    const playerData = players.get(socket.id);
    
    if (playerData) {
      const room = rooms.get(playerData.roomCode);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        // If host disconnected, transfer host
        if (playerData.isHost && room.players.length > 0) {
          room.host = room.players[0].id;
          const newHostData = players.get(room.players[0].id);
          if (newHostData) {
            newHostData.isHost = true;
          }
          io.to(playerData.roomCode).emit('hostTransferred', {
            newHost: room.players[0].id,
            room
          });
        }

        // If no players left, delete room
        if (room.players.length === 0) {
          rooms.delete(playerData.roomCode);
        } else {
          io.to(playerData.roomCode).emit('playerLeft', { room });
        }
      }
      players.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Network access: http://YOUR_IP:${PORT}`);
});

