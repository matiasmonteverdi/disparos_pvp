/**
 * Player Type Definitions
 * Shared between client and server
 */

import type { AmmoRecord } from './weapon.types';

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface PlayerInput {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    shoot: boolean;
    weaponSlot: number | null;
}

export interface PlayerPowerups {
    invuln?: number;
    invis?: number;
    quad?: number;
}

export interface PlayerState {
    id: string;
    name: string;
    position: Vector3;
    angle: number;
    velocity: Vector3;
    health: number;
    armor: number;
    currentWeapon: string;
    ammo: AmmoRecord;
    weapons: string[];
    powerups: PlayerPowerups;
    lastShootTime: number;
    kills: number;
    deaths: number;
    team?: 'red' | 'blue';
    ping?: number;
    lastPingTime?: number;
}
