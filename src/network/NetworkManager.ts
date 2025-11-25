import { io, Socket } from 'socket.io-client';
import { NETWORK_CONFIG } from '../config/constants';
import type { PlayerInput, PlayerState } from '../entities/Player';

export interface NetworkPlayer {
    id: string;
    state: PlayerState;
}

export interface ChatMessage {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: number;
}

export class NetworkManager {
    private socket: Socket | null = null;
    private connected: boolean = false;
    private playerId: string = '';
    private otherPlayers: Map<string, NetworkPlayer> = new Map();
    private onPlayerJoinCallback?: (player: NetworkPlayer) => void;
    private onPlayerLeaveCallback?: (playerId: string) => void;
    private onPlayerUpdateCallback?: (player: NetworkPlayer) => void;
    private onShootCallback?: (data: any) => void;
    private onChatMessageCallback?: (message: ChatMessage) => void;
    private onPlayerCountCallback?: (count: number) => void;

    constructor() { }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = io(NETWORK_CONFIG.SERVER_URL);

            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connected = true;
                this.playerId = this.socket!.id || '';
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            this.socket.on('serverFull', () => {
                console.error('Server is full');
                reject(new Error('Server is full (max 8 players)'));
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
                if (playerState.id !== this.playerId) {
                    const player = this.otherPlayers.get(playerState.id);
                    if (player) {
                        player.state = playerState;
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

    public sendChatMessage(message: string): void {
        if (this.socket && this.connected) {
            this.socket.emit('chatMessage', message);
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

    public onShoot(callback: (data: any) => void): void {
        this.onShootCallback = callback;
    }

    public onChatMessage(callback: (message: ChatMessage) => void): void {
        this.onChatMessageCallback = callback;
    }

    public onPlayerCount(callback: (count: number) => void): void {
        this.onPlayerCountCallback = callback;
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

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
        }
    }
}
