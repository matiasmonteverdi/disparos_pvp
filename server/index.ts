import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { PlayerState, PlayerInput, Vector3 } from '../shared/types/player.types';
import type { ChatMessage, LeaderboardEntry, Item, ShootData } from '../shared/types/network.types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingInterval: 1000,
    pingTimeout: 5000,
});

const PORT = process.env.PORT || 3001;
const MAX_PLAYERS = 8;
const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;
const MAX_SPEED = 300; // Max units per second for anti-cheat
const MAX_POSITION_DELTA = 50; // Max position change per update



const items: Map<string, Item> = new Map();

function initializeItems() {
    // Map data from DM_MAP_1
    const pickups = [
        { x: 5 * 64 + 32, z: 5 * 64 + 32, type: 'health_large' },
        { x: 14 * 64 + 32, z: 5 * 64 + 32, type: 'health_large' },
        { x: 5 * 64 + 32, z: 14 * 64 + 32, type: 'health_large' },
        { x: 14 * 64 + 32, z: 14 * 64 + 32, type: 'health_large' },
        { x: 10 * 64 + 32, z: 5 * 64 + 32, type: 'armor_large' },
        { x: 10 * 64 + 32, z: 14 * 64 + 32, type: 'armor_large' },
        { x: 7 * 64 + 32, z: 10 * 64 + 32, type: 'health_mega' },
        { x: 12 * 64 + 32, z: 10 * 64 + 32, type: 'armor_small' },
    ];

    const weapons = [
        { x: 3 * 64 + 32, z: 10 * 64 + 32, type: 'shotgun' },
        { x: 16 * 64 + 32, z: 10 * 64 + 32, type: 'shotgun' },
        { x: 10 * 64 + 32, z: 3 * 64 + 32, type: 'chaingun' },
        { x: 10 * 64 + 32, z: 16 * 64 + 32, type: 'rocket' },
    ];

    let idCounter = 0;

    pickups.forEach(p => {
        const id = `item_${idCounter++}`;
        let type: Item['type'] = 'health';
        let value = 0;

        if (p.type.includes('health')) {
            type = 'health';
            value = p.type === 'health_mega' ? 100 : (p.type === 'health_large' ? 25 : 10);
        } else if (p.type.includes('armor')) {
            type = 'armor';
            value = p.type === 'armor_large' ? 100 : 25;
        }

        items.set(id, {
            id,
            type,
            subtype: p.type,
            position: { x: p.x, y: 16, z: p.z },
            active: true,
            respawnTime: 0,
            value
        });
    });

    weapons.forEach(w => {
        const id = `item_${idCounter++}`;
        items.set(id, {
            id,
            type: 'weapon',
            subtype: w.type,
            position: { x: w.x, y: 16, z: w.z },
            active: true,
            respawnTime: 0,
            value: 1
        });
    });
}

initializeItems();

function checkItemCollection() {
    const now = Date.now();

    // Respawn items
    items.forEach(item => {
        if (!item.active && now >= item.respawnTime) {
            item.active = true;
            io.emit('itemSpawn', {
                id: item.id,
                type: item.type,
                position: item.position,
                value: item.value
            });
        }
    });

    // Check collisions
    players.forEach(player => {
        if (player.health <= 0) return;

        items.forEach(item => {
            if (!item.active) return;

            const dx = player.position.x - item.position.x;
            const dz = player.position.z - item.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 32) { // 32 units radius
                let collected = false;

                if (item.type === 'health') {
                    if (player.health < 100 || (item.subtype === 'health_mega' && player.health < 200)) {
                        player.health = Math.min(item.subtype === 'health_mega' ? 200 : 100, player.health + (item.value || 0));
                        collected = true;
                    }
                } else if (item.type === 'armor') {
                    if (player.armor < 200) {
                        player.armor = Math.min(200, player.armor + (item.value || 0));
                        collected = true;
                    }
                } else if (item.type === 'weapon') {
                    if (!player.weapons.includes(item.subtype || '')) {
                        player.weapons.push(item.subtype || '');
                        collected = true;
                    }
                    // Add ammo logic here if needed
                }

                if (collected) {
                    item.active = false;
                    item.respawnTime = now + 30000; // 30 seconds respawn
                    io.emit('itemCollected', { itemId: item.id, playerId: player.id });
                    io.emit('playerUpdate', player);
                }
            }
        });
    });
}

const players: Map<string, PlayerState> = new Map();
const playerPings: Map<string, { sentTime: number, rtt: number[] }> = new Map();

// Team balancing
function assignTeam(): 'red' | 'blue' {
    let redCount = 0;
    let blueCount = 0;

    players.forEach(player => {
        if (player.team === 'red') redCount++;
        else blueCount++;
    });

    return redCount <= blueCount ? 'red' : 'blue';
}

// Validate position change (anti-cheat)
function validatePosition(oldPos: Vector3, newPos: Vector3, deltaTime: number): boolean {
    const dx = newPos.x - oldPos.x;
    const dy = newPos.y - oldPos.y;
    const dz = newPos.z - oldPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Check if movement is physically possible
    const maxDistance = MAX_SPEED * deltaTime;
    if (distance > maxDistance) {
        console.warn(`Suspicious movement detected: ${distance} > ${maxDistance}`);
        return false;
    }

    return true;
}

// Get leaderboard
function getLeaderboard(): LeaderboardEntry[] {
    const entries: LeaderboardEntry[] = [];

    players.forEach(player => {
        entries.push({
            id: player.id,
            name: player.name,
            kills: player.kills,
            deaths: player.deaths,
            team: player.team || 'red',
            ping: player.ping || 0
        });
    });

    // Sort by kills (descending), then by deaths (ascending)
    return entries.sort((a, b) => {
        if (b.kills !== a.kills) return b.kills - a.kills;
        return a.deaths - b.deaths;
    });
}

// Broadcast leaderboard to all players
function broadcastLeaderboard() {
    const leaderboard = getLeaderboard();
    io.emit('leaderboard', leaderboard);
}

io.on('connection', (socket) => {
    console.log('Player attempting to connect:', socket.id);

    // Initialize ping tracking
    playerPings.set(socket.id, { sentTime: Date.now(), rtt: [] });

    // Check if server is full
    if (players.size >= MAX_PLAYERS) {
        console.log('Server full, rejecting connection:', socket.id);
        socket.emit('serverFull');
        socket.disconnect();
        return;
    }

    // Handle ping measurement
    socket.on('ping', (timestamp: number) => {
        socket.emit('pong', timestamp);
    });

    socket.on('pong', (sentTime: number) => {
        const rtt = Date.now() - sentTime;
        const pingData = playerPings.get(socket.id);

        if (pingData) {
            pingData.rtt.push(rtt);
            // Keep only last 10 measurements
            if (pingData.rtt.length > 10) {
                pingData.rtt.shift();
            }

            // Calculate average ping
            const avgPing = Math.round(
                pingData.rtt.reduce((a, b) => a + b, 0) / pingData.rtt.length
            );

            const player = players.get(socket.id);
            if (player) {
                player.ping = avgPing;
                player.lastPingTime = Date.now();
            }
        }
    });

    // Wait for player to send their name
    socket.on('joinGame', (playerName: string) => {
        console.log('Player joined:', socket.id, 'Name:', playerName);

        // Initialize player with spawn position
        const spawnPoints = [
            { x: 3 * 64 + 32, z: 3 * 64 + 32 },
            { x: 16 * 64 + 32, z: 3 * 64 + 32 },
            { x: 3 * 64 + 32, z: 16 * 64 + 32 },
            { x: 16 * 64 + 32, z: 16 * 64 + 32 },
            { x: 10 * 64 + 32, z: 10 * 64 + 32 },
        ];

        const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        const team = assignTeam();

        const newPlayer: PlayerState = {
            id: socket.id,
            name: playerName || 'Player',
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
            team: team,
            ping: 0,
            lastPingTime: Date.now(),
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

        // Send join message to all players
        const joinMessage: ChatMessage = {
            playerId: 'system',
            playerName: 'System',
            message: `${playerName} joined the ${team} team`,
            timestamp: Date.now(),
            type: 'system',
        };
        io.emit('chatMessage', joinMessage);

        // Send player count and leaderboard
        io.emit('playerCount', players.size);
        broadcastLeaderboard();

        // Send active items
        items.forEach(item => {
            if (item.active) {
                socket.emit('itemSpawn', {
                    id: item.id,
                    type: item.type,
                    position: item.position,
                    value: item.value
                });
            }
        });
    });

    // Handle chat messages
    socket.on('chatMessage', (message: string) => {
        const player = players.get(socket.id);
        if (player && message.trim().length > 0) {
            const chatMessage: ChatMessage = {
                playerId: socket.id,
                playerName: player.name,
                message: message.trim().substring(0, 200),
                timestamp: Date.now(),
                type: 'chat',
            };
            io.emit('chatMessage', chatMessage);
        }
    });

    // Handle team chat
    socket.on('teamChatMessage', (message: string) => {
        const player = players.get(socket.id);
        if (player && message.trim().length > 0) {
            const chatMessage: ChatMessage = {
                playerId: socket.id,
                playerName: player.name,
                message: message.trim().substring(0, 200),
                timestamp: Date.now(),
                type: 'team',
            };

            // Send only to team members
            players.forEach((p, id) => {
                if (p.team === player.team) {
                    io.to(id).emit('chatMessage', chatMessage);
                }
            });
        }
    });

    // Handle player state updates with validation
    let lastUpdateTime = Date.now();
    socket.on('playerUpdate', (state: PlayerState) => {
        const player = players.get(socket.id);
        if (player) {
            const now = Date.now();
            const deltaTime = (now - lastUpdateTime) / 1000;
            lastUpdateTime = now;

            // Validate position change (anti-cheat)
            if (!validatePosition(player.position, state.position, deltaTime)) {
                console.warn(`Invalid position from ${player.name}, reverting`);
                // Send corrected position back to client
                socket.emit('positionCorrection', player.position);
                return;
            }

            // Update player state (server has authority over health/armor/ammo)
            player.position = state.position;
            player.angle = state.angle;
            player.currentWeapon = state.currentWeapon;
            player.weapons = state.weapons;
            player.powerups = state.powerups;

            // Client can suggest but server validates
            // (In full implementation, server would calculate these)
            player.health = Math.max(0, Math.min(200, state.health));
            player.armor = Math.max(0, Math.min(200, state.armor));

            // Broadcast to other players
            socket.broadcast.emit('playerUpdate', player);
        }
    });

    // Handle shooting with server validation
    socket.on('playerShoot', (data: Omit<ShootData, 'playerId'>) => {
        const player = players.get(socket.id);
        if (!player) return;

        const now = Date.now();

        // Rate limiting based on weapon fire rate
        const weaponFireRates: Record<string, number> = {
            'pistol': 500,
            'shotgun': 800,
            'chaingun': 100,
            'rocket': 1000,
            'plasma': 200,
            'bfg': 2000,
        };

        const minInterval = weaponFireRates[data.weaponId] || 500;
        if (now - player.lastShootTime < minInterval) {
            console.warn(`Rate limit exceeded for ${player.name}`);
            return;
        }

        player.lastShootTime = now;

        // Broadcast shoot event to all players
        io.emit('playerShoot', {
            playerId: socket.id,
            ...data,
        });
    });

    // Handle player hit with server authority
    socket.on('playerHit', (data: { targetId: string; damage: number; attackerId: string }) => {
        console.log('Player hit event received:', data);
        const target = players.get(data.targetId);
        const attacker = players.get(data.attackerId);

        if (target && attacker) {
            // Prevent team killing (optional - can be enabled for hardcore mode)
            if (target.team === attacker.team && target.id !== attacker.id) {
                console.log('Team kill prevented');
                return;
            }

            console.log(`Applying damage: ${data.damage} from ${attacker.name} to ${target.name}`);

            // Server validates and applies damage
            let damage = Math.max(0, Math.min(200, data.damage)); // Clamp damage

            // Armor absorption (50%)
            if (target.armor > 0) {
                const armorDamage = Math.min(target.armor, Math.ceil(damage * 0.5));
                target.armor -= armorDamage;
                damage -= armorDamage;
            }

            target.health -= damage;
            console.log(`New health for ${target.name}: ${target.health}`);

            // Check for death
            if (target.health <= 0) {
                target.deaths++;
                attacker.kills++;

                // Broadcast kill message
                const killMessage: ChatMessage = {
                    playerId: 'system',
                    playerName: 'System',
                    message: `${target.name} was fragged by ${attacker.name}`,
                    timestamp: Date.now(),
                    type: 'kill',
                };
                io.emit('chatMessage', killMessage);

                // Respawn target
                const spawnPoints = [
                    { x: 3 * 64 + 32, z: 3 * 64 + 32 },
                    { x: 16 * 64 + 32, z: 3 * 64 + 32 },
                    { x: 3 * 64 + 32, z: 16 * 64 + 32 },
                    { x: 16 * 64 + 32, z: 16 * 64 + 32 },
                    { x: 10 * 64 + 32, z: 10 * 64 + 32 },
                ];
                const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
                target.position = { x: spawn.x, y: 32, z: spawn.z };
                target.health = 100;
                target.armor = 0;
                target.currentWeapon = 'pistol';
                target.ammo = { bullets: 50, shells: 0, rockets: 0, cells: 0 };

                // Update leaderboard
                broadcastLeaderboard();
            }

            // Broadcast updates
            io.emit('playerUpdate', target);
            io.emit('playerUpdate', attacker);
        } else {
            console.log('Target or attacker not found:', { target: !!target, attacker: !!attacker });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        if (player) {
            console.log('Player disconnected:', socket.id, 'Name:', player.name);

            // Send leave message
            const leaveMessage: ChatMessage = {
                playerId: 'system',
                playerName: 'System',
                message: `${player.name} left the game`,
                timestamp: Date.now(),
                type: 'system',
            };
            io.emit('chatMessage', leaveMessage);

            players.delete(socket.id);
            playerPings.delete(socket.id);
            io.emit('playerDisconnected', socket.id);
            io.emit('playerCount', players.size);
            broadcastLeaderboard();
        }
    });
});

// Server tick for ping updates and leaderboard
let lastTick = Date.now();
let leaderboardUpdateCounter = 0;

setInterval(() => {
    const now = Date.now();
    const deltaTime = (now - lastTick) / 1000;
    lastTick = now;

    // Send ping requests to all players
    players.forEach((player, id) => {
        io.to(id).emit('ping', now);
    });

    // Update leaderboard every 2 seconds
    leaderboardUpdateCounter++;
    if (leaderboardUpdateCounter >= 120) { // 60 ticks * 2 = 2 seconds
        broadcastLeaderboard();
        leaderboardUpdateCounter = 0;
    }

    checkItemCollection();
}, TICK_INTERVAL);

httpServer.listen(PORT, () => {
    console.log(`🎮 DOOM PvP Server running on port ${PORT}`);
    console.log(`👥 Max players: ${MAX_PLAYERS}`);
    console.log(`⚡ Tick rate: ${TICK_RATE}Hz`);
    console.log(`🛡️  Server authority: ENABLED`);
    console.log(`🔴🔵 Team mode: ENABLED`);
});
