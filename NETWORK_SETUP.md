# Network Setup Guide

This guide explains how to run the game on your local network so other players can join from different devices.

## Quick Start

### 1. Find Your IP Address

**On macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Example:** Your IP might be `192.168.1.100` or `10.0.0.5`

### 2. Start the Server (Network Access)

The server already accepts connections from any IP. Just start it normally:

```bash
cd server
npm start
```

The server will run on `http://0.0.0.0:3000` (accessible from network).

### 3. Start the Client (Network Access)

**Option A: Use the network script (Recommended)**
```bash
npm run dev-network
```

**Option B: Use regular dev with host flag**
```bash
vite --config vite/config.dev.mjs --host
```

You'll see output like:
```
➜  Local:   http://localhost:8080/
➜  Network: http://192.168.1.100:8080/
```

### 4. Share the Network URL

Share the **Network** URL (e.g., `http://192.168.1.100:8080/`) with other players.

**Important:** Other players need to:
1. Use the **Network URL** (not localhost)
2. Make sure the server is accessible (see Server Configuration below)

## Server Configuration

### For Local Network (Same WiFi)

The server is already configured to accept connections from your local network. Just make sure:

1. **Firewall**: Allow port 3000 (server) and 8080 (client) through your firewall
2. **Same Network**: All players must be on the same WiFi network

### For Internet Access (Different Networks)

To allow players from different networks:

1. **Port Forwarding**: Forward ports 3000 and 8080 on your router
2. **Use Your Public IP**: Players will connect to your public IP address
3. **Or Use a Service**: Deploy to a cloud service (Heroku, Railway, etc.)

## Updating NetworkManager for Different IPs

If you need to change the server URL, edit `src/game/utils/NetworkManager.ts`:

```typescript
constructor(serverUrl: string = 'http://localhost:3000') {
    // Change to your IP:
    // 'http://192.168.1.100:3000' for local network
    // 'http://YOUR_PUBLIC_IP:3000' for internet
}
```

Or create an environment-based configuration.

## Troubleshooting

### "Connection refused" or "Cannot connect to server"

1. **Check server is running**: `cd server && npm start`
2. **Check firewall**: Allow ports 3000 and 8080
3. **Check IP address**: Make sure you're using the correct IP
4. **Check network**: All devices must be on the same network (for local play)

### "CORS error" in browser

The server already has CORS enabled. If you see CORS errors:
- Make sure server is running
- Check server console for errors
- Verify the server URL in NetworkManager

### Players can't see each other

1. **Check server logs**: Look for connection messages
2. **Verify room code**: Make sure all players use the same room code
3. **Check network connectivity**: Ping the server IP from other devices

## Testing Locally First

Before sharing with others:

1. Test on your own machine: `http://localhost:8080`
2. Test on your phone (same WiFi): Use your computer's IP
3. Test with a friend on the same network

## Production Deployment

For production (internet access), consider:

1. **Deploy server to cloud**: Heroku, Railway, DigitalOcean, etc.
2. **Deploy client to static host**: Netlify, Vercel, GitHub Pages
3. **Update server URL**: Point NetworkManager to your production server

Example production setup:
- Server: `https://your-game-server.herokuapp.com`
- Client: `https://your-game.netlify.app`
- NetworkManager: `'https://your-game-server.herokuapp.com'`

