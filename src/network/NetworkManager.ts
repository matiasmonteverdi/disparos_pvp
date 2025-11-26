import { io, Socket } from 'socket.io-client';
import { NETWORK_CONFIG } from '../config/constants';
import type { PlayerInput, PlayerState } from '../entities/Player';

export interface NetworkPlayer {
    id: string;
    state: PlayerState;
    previousState?: PlayerState;
    targetState?: PlayerState;
    lastUpdateTime?: number;
    interpolationProgress?: number;
}

export interface ChatMessage {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: number;
    type?: 'chat' | 'system' | 'kill' | 'team';
}

export interface LeaderboardEntry {
    id: string;
    name: string;
    kills: number;
    deaths: number;
    team: 'red' | 'blue';
    ping: number;
}

export interface ItemSpawn {
    id: string;
    type: 'health' | 'armor' | 'ammo' | 'weapon';
    position: { x: number; y: number; z: number };
    value: number;
}

export type GameStatus = 'waiting' | 'warmup' | 'playing' | 'ended';

export interface GameState {
    status: GameStatus;
    timeRemaining: number;
    scores: {
        red: number;
        blue: number;
    };
    winningTeam?: 'red' | 'blue' | 'draw';
}

export class NetworkManager {
    private socket: Socket | null = null;
    private connected: boolean = false;
    private playerId: string = '';
    private otherPlayers: Map<string, NetworkPlayer> = new Map();
    private onPlayerJoinCallback?: (player: NetworkPlayer) => void;
    private onPlayerLeaveCallback?: (playerId: string) => void;
    private onPlayerUpdateCallback?: (player: NetworkPlayer) => void;
    private onLocalPlayerUpdateCallback?: (state: PlayerState) => void;
    private onShootCallback?: (data: any) => void;
    private onChatMessageCallback?: (message: ChatMessage) => void;
    private onPlayerCountCallback?: (count: number) => void;
    private onLeaderboardCallback?: (leaderboard: LeaderboardEntry[]) => void;
    private onPingUpdateCallback?: (ping: number) => void;
    // New callbacks for reconnection events
    private onReconnectingCallback?: (attempt: number) => void;
    private onReconnectedCallback?: () => void;
    private onItemSpawnCallback?: (item: ItemSpawn) => void;
    private onItemCollectedCallback?: (itemId: string, playerId: string) => void;
    private onGameStateUpdateCallback?: (state: GameState) => void;

    private ping: number = 0;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 2000;
    private reconnecting: boolean = false;

    constructor() { }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = io(NETWORK_CONFIG.SERVER_URL, {
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay,
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to server');
                this.connected = true;
                this.playerId = this.socket!.id || '';
                this.reconnectAttempts = 0;
                this.reconnecting = false;
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ Connection error:', error);
                reject(error);
            });

            this.socket.on('reconnect_attempt', (attemptNumber) => {
                console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
                this.reconnecting = true;
                this.reconnectAttempts = attemptNumber;
                // Notify UI about reconnection attempt
                if (this.onReconnectingCallback) {
                    this.onReconnectingCallback(attemptNumber);
                }
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log(`✅ Reconnected after ${attemptNumber} attempts`);
                this.reconnecting = false;
                // Notify UI that reconnection succeeded
                if (this.onReconnectedCallback) {
                    this.onReconnectedCallback();
                }
            });

            this.socket.on('reconnect_failed', () => {
                console.error('❌ Reconnection failed after max attempts');
                this.reconnecting = false;
            });

            this.socket.on('disconnect', (reason) => {
                console.log('🔌 Disconnected:', reason);
                this.connected = false;

                if (reason === 'io server disconnect') {
                    // Server disconnected us, try to reconnect
                    this.socket?.connect();
                }
            });

            this.socket.on('serverFull', () => {
                console.error('Server is full');
                reject(new Error('Server is full (max 8 players)'));
            });

            // Ping/Pong for latency measurement
            this.socket.on('ping', (timestamp: number) => {
                this.socket?.emit('pong', timestamp);
            });

            this.socket.on('pong', (sentTime: number) => {
                this.ping = Date.now() - sentTime;
                if (this.onPingUpdateCallback) {
                    this.onPingUpdateCallback(this.ping);
                }
            });

            // Position correction from server (anti-cheat)
            this.socket.on('positionCorrection', (position: { x: number; y: number; z: number }) => {
                console.warn('⚠️ Position corrected by server');
                if (this.onLocalPlayerUpdateCallback) {
                    // Server is telling us our position was invalid
                    this.onLocalPlayerUpdateCallback({ position } as any);
                }
            });

            this.socket.on('currentPlayers', (players: Record<string, PlayerState>) => {
                Object.entries(players).forEach(([id, state]) => {
                    if (id !== this.playerId) {
                        this.otherPlayers.set(id, { id, state });
                        if (this.onPlayerJoinCallback) {
                            this.onPlayerJoinCallback({ id, state });
                        }
                    }
                });
            });

            this.socket.on('newPlayer', (playerState: PlayerState) => {
                if (playerState.id !== this.playerId) {
                    this.otherPlayers.set(playerState.id, { id: playerState.id, state: playerState });
                    if (this.onPlayerJoinCallback) {
                        this.onPlayerJoinCallback({ id: playerState.id, state: playerState });
                    }
                }
            });

            this.socket.on('playerDisconnected', (playerId: string) => {
                this.otherPlayers.delete(playerId);
                if (this.onPlayerLeaveCallback) {
                    this.onPlayerLeaveCallback(playerId);
                }
            });

            this.socket.on('playerUpdate', (playerState: PlayerState) => {
                if (playerState.id === this.playerId) {
                    if (this.onLocalPlayerUpdateCallback) {
                        this.onLocalPlayerUpdateCallback(playerState);
                    }
                } else {
                    const player = this.otherPlayers.get(playerState.id);
                    if (player) {
                        // Store previous state for interpolation
                        player.previousState = { ...player.state };
                        player.targetState = playerState;
                        player.lastUpdateTime = Date.now();
                        player.interpolationProgress = 0;

                        if (this.onPlayerUpdateCallback) {
                            this.onPlayerUpdateCallback(player);
                        }
                    }
                }
            });

            this.socket.on('playerShoot', (data: any) => {
                if (this.onShootCallback) {
                    this.onShootCallback(data);
                }
            });

            this.socket.on('chatMessage', (message: ChatMessage) => {
                if (this.onChatMessageCallback) {
                    this.onChatMessageCallback(message);
                }
            });

            this.socket.on('playerCount', (count: number) => {
                if (this.onPlayerCountCallback) {
                    this.onPlayerCountCallback(count);
                }
            });

            this.socket.on('leaderboard', (leaderboard: LeaderboardEntry[]) => {
                if (this.onLeaderboardCallback) {
                    this.onLeaderboardCallback(leaderboard);
                }
            });

            this.socket.on('itemSpawn', (item: ItemSpawn) => {
                if (this.onItemSpawnCallback) {
                    this.onItemSpawnCallback(item);
                }
            });

            this.socket.on('itemCollected', (data: { itemId: string, playerId: string }) => {
                if (this.onItemCollectedCallback) {
                    this.onItemCollectedCallback(data.itemId, data.playerId);
                }
            });

            this.socket.on('gameStateUpdate', (state: GameState) => {
                if (this.onGameStateUpdateCallback) {
                    this.onGameStateUpdateCallback(state);
                }
            });
        });
    }

    public joinGame(playerName: string): void {
        if (this.socket && this.connected) {
            this.socket.emit('joinGame', playerName);
        }
    }

    public sendInput(input: PlayerInput): void {
        if (this.socket && this.connected) {
            this.socket.emit('playerInput', input);
        }
    }

    public sendPlayerState(state: PlayerState): void {
        if (this.socket && this.connected) {
            this.socket.emit('playerUpdate', state);
        }
    }

    public sendShoot(weaponId: string, angle: number, position: { x: number; y: number; z: number }): void {
        if (this.socket && this.connected) {
            this.socket.emit('playerShoot', { weaponId, angle, position });
        }
    }

    public sendHit(targetId: string, damage: number): void {
        if (this.socket && this.connected) {
            this.socket.emit('playerHit', {
                targetId,
                damage,
                attackerId: this.playerId
            });
        }
    }

    public sendChatMessage(message: string): void {
        if (this.socket && this.connected) {
            this.socket.emit('chatMessage', message);
        }
    }

    public sendTeamChatMessage(message: string): void {
        if (this.socket && this.connected) {
            this.socket.emit('teamChatMessage', message);
        }
    }

    // Ping measurement
    public measurePing(): void {
        if (this.socket && this.connected) {
            this.socket.emit('ping', Date.now());
        }
    }

    public onPlayerJoin(callback: (player: NetworkPlayer) => void): void {
        this.onPlayerJoinCallback = callback;
    }

    public onPlayerLeave(callback: (playerId: string) => void): void {
        this.onPlayerLeaveCallback = callback;
    }

    public onPlayerUpdate(callback: (player: NetworkPlayer) => void): void {
        this.onPlayerUpdateCallback = callback;
    }

    public onLocalPlayerUpdate(callback: (state: PlayerState) => void): void {
        this.onLocalPlayerUpdateCallback = callback;
    }

    public onShoot(callback: (data: any) => void): void {
        this.onShootCallback = callback;
    }

    public onChatMessage(callback: (message: ChatMessage) => void): void {
        this.onChatMessageCallback = callback;
    }

    public onPlayerCount(callback: (count: number) => void): void {
        this.onPlayerCountCallback = callback;
    }

    public onLeaderboard(callback: (leaderboard: LeaderboardEntry[]) => void): void {
        this.onLeaderboardCallback = callback;
    }

    // Register callback for reconnection attempts
    public onReconnecting(callback: (attempt: number) => void): void {
        this.onReconnectingCallback = callback;
    }

    // Register callback for successful reconnection
    public onReconnected(callback: () => void): void {
        this.onReconnectedCallback = callback;
    }

    public onPingUpdate(callback: (ping: number) => void): void {
        this.onPingUpdateCallback = callback;
    }

    public onItemSpawn(callback: (item: ItemSpawn) => void): void {
        this.onItemSpawnCallback = callback;
    }

    public onItemCollected(callback: (itemId: string, playerId: string) => void): void {
        this.onItemCollectedCallback = callback;
    }

    public onGameStateUpdate(callback: (state: GameState) => void): void {
        this.onGameStateUpdateCallback = callback;
    }

    public getOtherPlayers(): Map<string, NetworkPlayer> {
        return this.otherPlayers;
    }

    public getPlayerId(): string {
        return this.playerId;
    }

    public isConnected(): boolean {
        return this.connected;
    }

    public isReconnecting(): boolean {
        return this.reconnecting;
    }

    public getPing(): number {
        return this.ping;
    }

    public getReconnectAttempts(): number {
        return this.reconnectAttempts;
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
        }
    }
}
