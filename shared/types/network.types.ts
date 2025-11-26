/**
 * Network Type Definitions
 * Shared between client and server
 */

import type { PlayerState, Vector3 } from './player.types';

export interface NetworkPlayer {
    id: string;
    state: PlayerState;
    previousState?: PlayerState;
    targetState?: PlayerState;
    lastUpdateTime?: number;
    interpolationProgress?: number;
}

export type ChatMessageType = 'chat' | 'system' | 'kill' | 'team';

export interface ChatMessage {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: number;
    type?: ChatMessageType;
}

export interface LeaderboardEntry {
    id: string;
    name: string;
    kills: number;
    deaths: number;
    team: 'red' | 'blue';
    ping: number;
}

export type ItemType = 'health' | 'armor' | 'ammo' | 'weapon';

export interface ItemSpawn {
    id: string;
    type: ItemType;
    position: Vector3;
    value?: number;
    subtype?: string;
}

export interface Item extends ItemSpawn {
    active: boolean;
    respawnTime: number;
}

export type GameStatus = 'waiting' | 'active' | 'ended';

export interface GameState {
    status: GameStatus;
    timeRemaining: number;
    scores: {
        red: number;
        blue: number;
    };
    winningTeam?: 'red' | 'blue' | 'draw';
}

export interface ShootData {
    playerId: string;
    weaponId: string;
    angle: number;
    position: Vector3;
}

export interface HitData {
    targetId: string;
    damage: number;
    shooterId: string;
}
