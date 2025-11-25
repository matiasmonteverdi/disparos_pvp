import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

interface Vector3 {
    x: number;
    y: number;
    z: number;
}

interface PlayerState {
    id: string;
    position: Vector3;
    angle: number;
    velocity: Vector3;
    health: number;
    armor: number;
    currentWeapon: string;
    ammo: Record<string, number>;
    weapons: string[];
    powerups: Record<string, number>;
    lastShootTime: number;
    kills: number;
    deaths: number;
}

interface PlayerInput {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    shoot: boolean;
    weaponSlot: number | null;
}

const players: Map<string, PlayerState> = new Map();
const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Initialize player with spawn position
    const spawnPoints = [
        { x: 3 * 64 + 32, z: 3 * 64 + 32 },
        { x: 16 * 64 + 32, z: 3 * 64 + 32 },
        { x: 3 * 64 + 32, z: 16 * 64 + 32 },
        { x: 16 * 64 + 32, z: 16 * 64 + 32 },
        { x: 10 * 64 + 32, z: 10 * 64 + 32 },
    ];

    const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    const newPlayer: PlayerState = {
        id: socket.id,
        position: { x: spawn.x, y: 32, z: spawn.z },
        angle: 0,
        velocity: { x: 0, y: 0, z: 0 },
        health: 100,
        armor: 0,
        currentWeapon: 'pistol',
        ammo: {
            bullets: 50,
            shells: 0,
            rockets: 0,
            cells: 0,
        },
        weapons: ['fists', 'pistol'],
        powerups: {},
        lastShootTime: 0,
        kills: 0,
        deaths: 0,
    };

    players.set(socket.id, newPlayer);

    // Send current players to new player
    const currentPlayers: Record<string, PlayerState> = {};
    players.forEach((player, id) => {
        currentPlayers[id] = player;
    });
    socket.emit('currentPlayers', currentPlayers);

    // Broadcast new player to all other players
    socket.broadcast.emit('newPlayer', newPlayer);

    // Handle player input
    socket.on('playerInput', (input: PlayerInput) => {
        // In a full implementation, we would process input server-side
        // For now, we trust the client (not ideal for production)
    });

    // Handle player state updates
    socket.on('playerUpdate', (state: PlayerState) => {
        const player = players.get(socket.id);
        if (player) {
            // Update player state
            player.position = state.position;
            player.angle = state.angle;
            player.health = state.health;
            player.armor = state.armor;
            player.currentWeapon = state.currentWeapon;
            player.ammo = state.ammo;
            player.weapons = state.weapons;
            player.powerups = state.powerups;
            player.kills = state.kills;
            player.deaths = state.deaths;

            // Broadcast to other players
            socket.broadcast.emit('playerUpdate', player);
        }
    });

    // Handle shooting
    socket.on('playerShoot', (data: { weaponId: string; angle: number; position: Vector3 }) => {
        // Broadcast shoot event to all players
        io.emit('playerShoot', {
            playerId: socket.id,
            ...data,
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

// Game loop for server-side simulation (optional, for future server authority)
let lastTick = Date.now();
setInterval(() => {
    const now = Date.now();
    const deltaTime = (now - lastTick) / 1000;
    lastTick = now;

    // Server-side game logic would go here
    // For now, we're using client-side authority
}, TICK_INTERVAL);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
